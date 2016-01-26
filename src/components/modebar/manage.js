/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var scatterSubTypes = require('../../traces/scatter/subtypes');

var createModeBar = require('./');
var modeBarButtons = require('./buttons');

/**
 * ModeBar wrapper around 'create' and 'update',
 * chooses buttons to pass to ModeBar constructor based on
 * plot type and plot config.
 *
 * @param {object} gd main plot object
 *
 */
module.exports = function manageModeBar(gd) {
    var fullLayout = gd._fullLayout,
        context = gd._context,
        modeBar = fullLayout._modeBar;

    if(!context.displayModeBar) {
        if(modeBar) {
            modeBar.destroy();
            delete fullLayout._modeBar;
        }
        return;
    }

    if(!Array.isArray(context.modeBarButtonsToRemove)) {
        throw new Error([
            '*modeBarButtonsToRemove* configuration options',
            'must be an array.'
        ].join(' '));
    }

    if(!Array.isArray(context.modeBarButtonsToAdd)) {
        throw new Error([
            '*modeBarButtonsToAdd* configuration options',
            'must be an array.'
        ].join(' '));
    }

    var customButtons = context.modeBarButtons;
    var buttonGroups;

    if(Array.isArray(customButtons) && customButtons.length) {
        buttonGroups = fillCustomButton(customButtons);
    }
    else {
        buttonGroups = getButtonGroups(
            gd,
            context.modeBarButtonsToRemove,
            context.modeBarButtonsToAdd
        );
    }

    if(modeBar) modeBar.update(gd, buttonGroups);
    else fullLayout._modeBar = createModeBar(gd, buttonGroups);
};

// logic behind which buttons are displayed by default
function getButtonGroups(gd, buttonsToRemove, buttonsToAdd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        groups = [],
        i,
        trace;

    function addGroup(newGroup) {
        var out = [];

        for(var i = 0; i < newGroup.length; i++) {
            var button = newGroup[i];
            if(buttonsToRemove.indexOf(button) !== -1) continue;
            out.push(modeBarButtons[button]);
        }

        groups.push(out);
    }

    if(fullLayout._hasGL3D) {
        addGroup(['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation']);
        addGroup(['resetCameraDefault3d', 'resetCameraLastSave3d']);
        addGroup(['hoverClosest3d']);
    }

    if(fullLayout._hasGeo) {
        addGroup(['zoomInGeo', 'zoomOutGeo', 'resetGeo']);
        addGroup(['hoverClosestGeo']);
    }

    var hasCartesian = fullLayout._hasCartesian,
        hasGL2D = fullLayout._hasGL2D,
        allAxesFixed = areAllAxesFixed(fullLayout),
        dragModeGroup = [];

    if((hasCartesian || hasGL2D) && !allAxesFixed) {
        dragModeGroup = ['zoom2d', 'pan2d'];
    }
    if(hasCartesian) {
        // look for traces that support selection
        // to be updated as we add more selectPoints handlers
        var selectable = false;
        for(i = 0; i < fullData.length; i++) {
            if(selectable) break;
            trace = fullData[i];
            if(!trace._module || !trace._module.selectPoints) continue;

            if(trace.type === 'scatter') {
                if(scatterSubTypes.hasMarkers(trace) || scatterSubTypes.hasText(trace)) {
                    selectable = true;
                }
            }
            // assume that in general if the trace module has selectPoints,
            // then it's selectable. Scatter is an exception to this because it must
            // have markers or text, not just be a scatter type.
            else selectable = true;
        }

        if(selectable) {
            dragModeGroup.push('select2d');
            dragModeGroup.push('lasso2d');
        }
    }
    if(dragModeGroup.length) addGroup(dragModeGroup);

    if((hasCartesian || hasGL2D) && !allAxesFixed) {
        addGroup(['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d']);
    }

    if(hasCartesian) {
        addGroup(['hoverClosestCartesian', 'hoverCompareCartesian']);
    }
    if(hasGL2D) {
        addGroup(['hoverClosestGl2d']);
    }
    if(fullLayout._hasPie) {
        addGroup(['hoverClosestPie']);
    }

    // append buttonsToAdd to the groups
    if(buttonsToAdd.length) {
        if(Array.isArray(buttonsToAdd[0])) {
            for(i = 0; i < buttonsToAdd.length; i++) {
                groups.push(buttonsToAdd[i]);
            }
        }
        else groups.push(buttonsToAdd);
    }

    return groups;
}

function areAllAxesFixed(fullLayout) {
    var axList = Plotly.Axes.list({_fullLayout: fullLayout}, null, true);
    var allFixed = true;

    for(var i = 0; i < axList.length; i++) {
        if(!axList[i].fixedrange) {
            allFixed = false;
            break;
        }
    }

    return allFixed;
}

// fill in custom buttons referring to default mode bar buttons
function fillCustomButton(customButtons) {
    for(var i = 0; i < customButtons.length; i++) {
        var buttonGroup = customButtons[i];

        for(var j = 0; j < buttonGroup.length; j++) {
            var button = buttonGroup[j];

            if(typeof button === 'string') {
                if(modeBarButtons[button] !== undefined) {
                    customButtons[i][j] = modeBarButtons[button];
                }
                else {
                    throw new Error([
                        '*modeBarButtons* configuration options',
                        'invalid button name'
                    ].join(' '));
                }
            }
        }
    }

    return customButtons;
}
