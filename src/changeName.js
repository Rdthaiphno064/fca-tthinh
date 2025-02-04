"use strict";

var utils = require('./../utils.js');
var log = require('npmlog');

module.exports = function (http, api, ctx) {
  return function changeName(data, format, callback) {
    var cb;
    var rtPromise = new Promise(function (resolve, reject) {
      cb = function (error) {
        error ? reject(error) : resolve();
      }
    });

    if (typeof data == 'function') {
      callback = data;
      data = null;
    }
    if (typeof format == 'function') {
      callback = format;
      format = 'complete';
    }
    if (typeof callback == 'function') cb = callback;
    if (utils.getType(data) != 'Object') 
      return cb('data is not an object');

    try {
      var full_name;
      if (!data.first_name || !data.last_name) {
        log.error('changeName', 'name is not be accepted');
        return cb('name is not be accepted');
      }
      if (format == 'complete') full_name = `${data.last_name} ${data.middle_name || ''} ${data.first_name}`;
      else if (format == 'standard') full_name = `${data.last_name} ${data.first_name}`;
      else if (format == 'reversed') full_name = `${data.first_name} ${data.middle_name || ''} ${data.last_name}`;
      else full_name = `${data.last_name} ${data.middle_name || ''} ${data.first_name}`;
      var form = {
        fb_api_caller_class: 'RelayModern',
        fb_api_req_friendly_name: 'useFXIMUpdateNameMutation',
        variables: JSON.stringify({
          client_mutation_id: utils.getGUID(),
          family_device_id: "device_id_fetch_datr",
          identity_ids: [ctx.userID],
          full_name: full_name, 
          first_name: data.first_name,
          middle_name: data.middle_name || '', 
          last_name: data.last_name,
          interface: 'FB_WEB'
        }),
        server_timestamps: true,
        doc_id: '5763510853763960'
      }
    } catch (error) {
      log.error('changeName', error);
      return cb(error);
    }

    http
      .post('https://accountscenter.facebook.com/api/graphql/', ctx.jar, form, null, null, {
        Origin: 'https://accountscenter.facebook.com',
        Referer: `https://accountscenter.facebook.com/profiles/${ctx.userID}/name`
      })
      .then(utils.parseAndCheckLogin(ctx, http))
      .then(function (res) {
        if (res.errors) throw res;
        else if (res.data.fxim_update_identity_name.error) 
          throw res.data.fxim_update_identity_name.error;
        return cb();
      })
      .catch(function (err) {
        log.error('changeName', err);
        return cb(err);
      })
    
    return rtPromise;
  }
}
