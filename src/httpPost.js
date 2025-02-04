"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  return function httpPost(url, form, customHeader, callback, notAPI) {
    var cb;
    var returnPromise = new Promise(function (resolve, reject) {
      cb = function (err, resData) {
        if (err) reject(err);
        resolve(resData);
      }
    });

    if (typeof form == 'function') {
      callback = form;
      form = {};
    }
    if (typeof customHeader == 'function') {
      callback = customHeader;
      customHeader = {}
    }
    if (typeof callback == 'boolean') {
      notAPI = callback;
      callback = null;
    }
    if (typeof callback == 'function') cb = callback;

    if (notAPI) {
      utils
        .post(url, ctx.jar, form, ctx.globalOptions, ctx, customHeader)
        .then(function (resData) {
          return cb(null, String(resData.body));
        })
        .catch(function (err) {
          log.error('httpPost', err);
          return cb(err);
        });
    } else {
      defaultFuncs
        .post(url, ctx.jar, form, {}, ctx, customHeader)
        .then(function (resData) {
          return cb(null, String(resData.body));
        })
        .catch(function (err) {
          log.error('httpPost', err);
          return cb(err);
        });
    }

    return returnPromise;
  }
}
