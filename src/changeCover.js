"use strict";

var utils = require('../utils.js');
var log = require("npmlog");

module.exports = function (http, api, ctx) {
  function handleUpload(image) {
    var cb;
    var nextURL = 'https://www.facebook.com/profile/picture/upload/';
    var rtPromise = new Promise(function (resolve, reject) {
      cb = function (error, data) {
        data ? resolve(data) : reject(error);
      }
    });

    if (!utils.isReadableStream(image)) 
      cb('image is not a readable stream');

    http
      .postFormData(nextURL, ctx.jar, {
        profile_id: ctx.userID,
        photo_source: 57,
        av: ctx.userID,
        file: image
      })
      .then(utils.parseAndCheckLogin(ctx, http))
      .then(function (res) {
        if (res.error) 
          throw res;
        return cb(null, res);
      })
      .catch(cb);

    return rtPromise;
  }

  return function changeCover(image, callback) {
    var cb;
    var rtPromise = new Promise(function (resolve, reject) {
      cb = function (error, data) {
        data ? resolve(data) : reject(error);
      }
    });
    
    if (typeof callback == 'function') cb = callback;

    handleUpload(image)
      .then(function (res) {
        var form = {
          fb_api_caller_class: "RelayModern",
          fb_api_req_friendly_name: "ProfileCometCoverPhotoUpdateMutation",
          variables: JSON.stringify({
            input: {
              attribution_id_v2: `ProfileCometCollectionRoot.react,comet.profile.collection.photos_by,unexpected,${Date.now()},770083,,;ProfileCometCollectionRoot.react,comet.profile.collection.photos_albums,unexpected,${Date.now()},470774,,;ProfileCometCollectionRoot.react,comet.profile.collection.photos,unexpected,${Date.now()},94740,,;ProfileCometCollectionRoot.react,comet.profile.collection.saved_reels_on_profile,unexpected,${Date.now()},89669,,;ProfileCometCollectionRoot.react,comet.profile.collection.reels_tab,unexpected,${Date.now()},152201,,`,
              cover_photo_id: res.payload.fbid,
              focus: {
                x: 0.5,
                y: 1
              },
              target_user_id: ctx.userID,
    actor_id: ctx.userID, 
              client_mutation_id: Math.round(Math.random() * 19).toString()
            },
            scale: 1,
            contextualProfileContext: null
          }),
          server_timestamps: !0,
          doc_id: "8247793861913071"
        }
        return http
          .post('https://www.facebook.com/api/graphql', ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, http));
      })
      .then(function (res) {
        if (res.errors) throw res;
        return cb(null, {
          url: res.data.user_update_cover_photo.user.cover_photo.photo.url
        });
      })
      .catch(function (err) {
        log.error('changeCover', err);
        return cb(err);
      });
    
    return rtPromise;
  }
}
