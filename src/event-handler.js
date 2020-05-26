var GETOFFER = 'getOffer';
// for future v2 updates for SPAs
var TRIGGERVIEW = 'TRIGGERVIEW';

function EventHandler(common) {
    this.common = common || {};
}

EventHandler.prototype.logEvent = function(event) {
    var MBOXNAME = event.CustomFlags['ADOBETARGET.MBOX'];
    var successHandler = event.CustomFlags['ADOBETARGET.SUCCESS'];
    var errorHandler = event.CustomFlags['ADOBETARGET.ERROR'];
    var getOffer = Boolean(event.CustomFlags['ADOBETARGET.GETOFFER']);
    var timeout = Boolean(event.CustomFlags['ADOBETARGET.TIMEOUT']);

    if (!MBOXNAME) {
        console.log(
            'ADOBE.MBOX not passed as custom flag; not forwarding to Adobe Target'
        );
        return false;
    }
    var options = {
        mbox: MBOXNAME,
        params: params,
        success: function(offer) {
            window.adobe.target.applyOffer(offer);
            if (event.CustomFlags['ADOBE.SUCCESS']) {
                successHandler(offer);
            }
        },
        error: function(status, error) {
            errorHandler(status, error);
        },
    };

    var params = {};
    for (var key in event.EventAttributes) {
        params[key] = event.EventAttributes[key];
    }

    // an event is either a getOffer event or a trackEvent event
    if (getOffer) {
        window.adobe.target.getOffer({
            timeout: timeout,
        });
    } else {
        var selector = Boolean(event.CustomFlags['ADOBETARGET.SELETOR']);
        var type = Boolean(event.CustomFlags['ADOBETARGET.TYPE']);
        var preventDefault = Boolean(
            event.CustomFlags['ADOBETARGET.PREVENTDEFAULT']
        );
        if (selector) {
            options.selector = selector;
        }
        if (type) {
            options.type = type;
        }
        if (preventDefault) {
            options.preventDefault = preventDefault;
        }
        if (timeout) {
            options.timeout = timeout;
        }
        window.adobe.target.trackEvent({
            mbox: MBOXNAME,
            params: params,
        });
    }

    return true;
};

EventHandler.prototype.logError = function() {};

EventHandler.prototype.logPageView = function(event) {
    var MBOXNAME = event.CustomFlags['ADOBE.MBOX'];
    if (!MBOXNAME) {
        console.log(
            'ADOBE.MBOX not passed as custom flag; not forwarding to Adobe Target'
        );
        return false;
    }

    var params = {};
    for (var key in event.EventAttributes) {
        params[key] = event.EventAttributes[key];
    }

    window.adobe.target.trackEvent({
        mbox: MBOXNAME,
        params: params,
    });
};

module.exports = EventHandler;
