/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var noop = function() {};


module.exports = function setConvert(containerOut) {
    Plotly.Axes.setConvert(containerOut);
    containerOut.setScale = noop;
};
