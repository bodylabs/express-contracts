var errors = require('./validation-error');

// Given a `requestContract` and a `responseContract`, construct a middleware
// that acts as a functional contract for the express endpoint.
//
// That is, check the `req` against `requestContract` (passing
// `ValidationError` to `next` on failure), and extend `res` with a method
// checkedJson that checks a payload against `responseContract` before sending
// (passing a `ContractError` as-is to `next` on failure).
//
// TODO: anything about query string?
// TODO: anything about default values for optional fields?
//
var endpointContract = function (requestContract, responseContract) {
    return function (req, res, next) {
        // patch first, because that should never fail, whereas input
        // validation could, in which case you'd prefer to have patched already
        validateRequest(req, requestContract, next);
        extendWithCheckedJson(res, responseContract, next);
        next();
    };
};

var extendWithCheckedJson = function (res, responseContract, next) {
    res.checkedJson = function (payload) {
        try {
            responseContract.check(payload);
        } catch (e) {
            return next(e);
        }
        res.json(payload);
    };
};

var validateRequest = function (req, requestContract, next) {
    try {
        requestContract.check(req.body);
    } catch (e) {
        return next(new errors.ValidationError(e.message));
    }
};

module.exports.endpointContract = endpointContract;
