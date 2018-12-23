
/**
 * Common database helper functions.
 */
let dbPromise;

window.addEventListener('load', () => {
  window.addEventListener('online',  () => {
    // check if any requests exist in objectStore
    var dbPromise = DBHelper.openDatabase();
    dbPromise.then(db => {
      db.transaction('pending', 'readonly')
      .objectStore('pending')
      .count()
      .then(req => {
        // console.log('Pending requests', req)

        if (req > 0)
        DBHelper.tryComittingPendingRequests();
      });
    });
  });
window.addEventListener('offline', () => {
    document.querySelector('#offline').setAttribute('aria-hidden', false);
    document.querySelector('#offline').setAttribute('aria-live', 'assertive');
    document.querySelector('#offline').classList.add('show');

    window.setTimeout(() => {
      document.querySelector('#offline').setAttribute('aria-hidden', true);
      document.querySelector('#offline').setAttribute('aria-live', 'off');
      document.querySelector('#offline').classList.remove('show');
    } , 8000);
  });
});

class DBHelper {

  /**
   * Open a IDB Database
   */
  static openDatabase() {
    dbPromise = idb.open('restaurantsDB', 1, function(upgradeDb){
      switch (upgradeDb.oldVersion) {
  case 0:
    upgradeDb.createObjectStore('restaurants', { keyPath: 'id', unique: true });
  case 1:
    upgradeDb.createObjectStore('reviews', {keyPath: 'id', autoIncrement: true });
  case 2:
    upgradeDb.createObjectStore('pending', {keyPath: 'id', autoIncrement: true });
}
});
  return dbPromise;
  }
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Review Database URL.
   * Change this to review location on your server.
   */
  static get REVIEW_DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/`;
  }

  /**
   * Show cached restaurants stored in IDB
   */
  static getCachedMessages(){
    dbPromise = DBHelper.openDatabase();
    return dbPromise.then(function(db){

      //if we showing posts or very first time of the page loading.
      //we don't need to go to idb
      if(!db) return;

      var tx = db.transaction('restaurants', 'readonly');
      var store = tx.objectStore('restaurants');
      return store.getAll();
    });
  }

  /**
   * Show cached restaurants stored in IDB
   */
  static getCachedReviews(id){
    dbPromise = DBHelper.openDatabase();
    return dbPromise.then(function(db){

      //if we showing posts or very first time of the page loading.
      //we don't need to go to idb
      if(!db) return;

      var tx = db.transaction('reviews', 'readonly');
      var store = tx.objectStore('reviews');

      return store.getAll();
    }).then(reviews => {
      return reviews.filter(review => review.restaurant_id === id)
    });
  }

  /*
  * Add restaurant to indexeDB
  */
 static addRestaurantToIdb (data) {
   const dbPromise = DBHelper.openDatabase()
   return dbPromise.then(function(db){
     var tx = db.transaction('restaurants', 'readwrite')
     var store = tx.objectStore('restaurants')
     data.map(restaurant => store.put(restaurant))
     return tx.complete
   })
 }

 /*
 * Add Review to Indexeddb
 */
 static addReviewToIdb (review) {
   const dbPromise = DBHelper.openDatabase()
   return dbPromise.then(function(db){
     var tx = db.transaction('reviews', 'readwrite')
     var store = tx.objectStore('reviews')
     store.put(review)
     return tx.complete
   })
 }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.getCachedMessages().then(function(data){
      // if we have data to show then we pass it immediately.
      if(data.length > 0){
        return callback(null , data);
      }else {
        // not found try to fetch from Network
        fetch(DBHelper.DATABASE_URL, {
          method: 'get'
        })
          .then(resp => resp.json())
          .then(data => {
            // console.log('Data',data);
            DBHelper.addRestaurantToIdb(data)
            callback(null, data)
          })
          .catch(err => callback(err, null))
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  // PUT
  // http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=true
  static markFavorite(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=true`, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }

  // PUT
  // http://localhost:1337/restaurants/<restaurant_id>/?is_favorite=false
  static unMarkFavorite(id) {
    fetch(`${DBHelper.DATABASE_URL}/${id}/?is_favorite=false`, {
      method: 'PUT'
    }).catch(err => console.log(err));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */


  static fetchRestaurantReviewsById(id, callback) {
    const currTime = Date.now()
    DBHelper.getCachedReviews(id).then(data => {
      if (data.length > 0) {
        data.sort(
          (a, b) => currTime - a.updatedAt - (currTime - b.updatedAt)
        )
        callback(data, null)
      }else {
        // not found try to fetch from Network
        fetch(DBHelper.REVIEW_DATABASE_URL +  `?restaurant_id=${id}`, {
          method: 'get'
        })
          .then(resp => resp.json())
          .then(data => {
            data.sort(
              (a, b) => currTime - a.updatedAt - (currTime - b.updatedAt)
            )
            // Adding Reviews to Indexed DB
            data.map(review => DBHelper.addReviewToIdb(review))
            callback(null, data)
          })
          .catch(err => callback(err, null))
      }
    });
  }

  // http://localhost:1337/reviews/
  static createRestaurantReview(name, comment, rating, res_id, callback) {
    let body = {
      id: Date.now(),
      restaurant_id: res_id,
      name: name,
      rating: rating,
      comments: comment,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    // update reviews indexeDB
    DBHelper.addReviewToIdb(body)
    // add to Database if online
    // else add to pending  request queue
    if (navigator.onLine) {
      DBHelper.saveReviewToDatabase(DBHelper.REVIEW_DATABASE_URL, 'POST', body);
    } else
    DBHelper.addRequestToQueue(DBHelper.REVIEW_DATABASE_URL, 'POST', body);
    callback(null, null)
  }

  static addRequestToQueue (url = '', method, body) {
    var dbPromise = DBHelper.openDatabase()
    return dbPromise.then(db => {
      var tx = db.transaction('pending', 'readwrite')
      var store = tx.objectStore('pending')
      store.add({
        url: url,
        method: method,
        body: body
      })
    })
  }
  static saveReviewToDatabase (url = '', method, body) {
      fetch(url, {
        method: 'post',
        body: JSON.stringify(body)
      })
        .then(resp => {
          // console.log('POST resp', resp)
        })
        .catch(err => {
          /* console.log('post request failed', err) */
        })
    }


  static tryComittingPendingRequests (callback) {
    // console.log('Trying to commit pending requests')
    var dbPromise = DBHelper.openDatabase()
    dbPromise.then(db => {
      var tx = db.transaction('pending', 'readwrite')
      tx.objectStore('pending')
        .openCursor()
        .then(cursor => {
          if (!cursor) {
            return
          }
          let url = cursor.value.url
          let method = cursor.value.method
          let body = cursor.value.body

          // if we have bad record delete it
          if (!url || !method || (method === 'post' && !body)) {
            cursor.delete()
            callback()
            return
          }
          // console.log('sending fetch', url, method, body)
          fetch(url, {
            method: method,
            body: JSON.stringify(body)
          })
            .then(resp => {
              if (!resp.ok) return
            })
            .then(() => {
              // start new transaction to delete
              db.transaction('pending', 'readwrite')
                .objectStore('pending')
                .openCursor()
                .then(cursor => {
                  cursor.delete().catch(error => {
                    return callback(error, null)
                  });
                });
            });
        });
    });
  }
  /**
   * Update Favorite Restaurant
   */
  static favoriteClickHandler (id, newState, restaurant) {
    // update cached restaurant data
    const is_favorite = JSON.parse(restaurant.is_favorite);
    restaurant.is_favorite = !is_favorite;
    const dbPromise = DBHelper.openDatabase()
    // get the cache restaurant data
    dbPromise
      .then(db => {
        var tx = db.transaction('restaurants', 'readonly')
        var store = tx.objectStore('restaurants')
        return store.get(id)
      })
      .then(val => {
        if (!val) {
          // console.log('No such data exists in cache')
          return
        }
        // update the cache restaurant data
        val.is_favorite = newState;
        dbPromise
          .then(db => {
            var tx = db.transaction('restaurants', 'readwrite')
            var store = tx.objectStore('restaurants')
            store.put(val)
            return tx.complete
          })
          .then(() => {
            // console.log('cache data updated')
          })
      })
      // Update the original data
      // if online send the fetch request else add to pending queue
      var url = DBHelper.DATABASE_URL + `/${id}/?is_favorite=${newState}`
      var method = 'PUT'
      if (navigator.onLine) {
        fetch(url, {
          method: method
        });
    } else {
      DBHelper.addRequestToQueue(url, method, null)
    }
  }

}
