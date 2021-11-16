function CommerceHandler(common) {
    this.common = common || {};
}

var ProductActionTypes = {
    AddToCart: 10,
    Click: 14,
    Checkout: 12,
    CheckoutOption: 13,
    Impression: 22,
    Purchase: 16,
    Refund: 17,
    RemoveFromCart: 11,
    ViewDetail: 15,
};

var PromotionType = {
    PromotionClick: 19,
    PromotionView: 18,
};

CommerceHandler.prototype.buildAddToCart = function (event) {
    return {
        currency: event.CurrencyCode,
        // TODO: What should the value of an add to cart be? Sum of the dollar amounts of items?
        // value: event.ProductAction.
        items: buildProductsList(event.ProductAction.ProductList),
    };
};

CommerceHandler.prototype.buildCheckout = function (event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                checkout: {
                    actionField: {
                        step: event.ProductAction.CheckoutStep,
                        option: event.ProductAction.CheckoutOptions,
                    },
                    products: buildProductsList(
                        event.ProductAction.ProductList
                    ),
                },
            },
        },
    };
};

CommerceHandler.prototype.buildCheckoutOption = function (event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                checkout_option: {
                    actionField: {
                        step: event.ProductAction.CheckoutStep,
                        option: event.ProductAction.CheckoutOptions,
                    },
                    products: buildProductsList(
                        event.ProductAction.ProductList
                    ),
                },
            },
        },
    };
};

CommerceHandler.prototype.buildRemoveFromCart = function (event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                currencyCode: event.CurrencyCode || 'USD',
                remove: {
                    products: buildProductsList(
                        event.ProductAction.ProductList
                    ),
                },
            },
        },
    };
};

CommerceHandler.prototype.buildImpression = function (event, impression) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                currencyCode: event.CurrencyCode || 'USD',
                impressions: buildProductsList(impression.ProductList),
            },
        },
    };
};

CommerceHandler.prototype.buildProductClick = function (event) {
    var actionField = {};

    if (event.EventAttributes && event.EventAttributes.hasOwnProperty('list')) {
        actionField['list'] = event.EventAttributes.list;
    }

    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                click: {
                    actionField: actionField,
                    products: buildProductsList(
                        event.ProductAction.ProductList
                    ),
                },
            },
        },
    };
};

CommerceHandler.prototype.buildProductViewDetail = function (event) {
    var actionField = {};

    if (event.EventAttributes && event.EventAttributes.hasOwnProperty('list')) {
        actionField['list'] = event.EventAttributes.list;
    }

    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                detail: {
                    actionField: actionField,
                    products: buildProductsList(
                        event.ProductAction.ProductList
                    ),
                },
            },
        },
    };
};
CommerceHandler.prototype.buildPromoClick = function (event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                promoClick: {
                    promotions: buildPromoList(
                        event.PromotionAction.PromotionList
                    ),
                },
            },
        },
    };
};
CommerceHandler.prototype.buildPromoView = function (event) {
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                promoView: {
                    promotions: buildPromoList(
                        event.PromotionAction.PromotionList
                    ),
                },
            },
        },
    };
};
CommerceHandler.prototype.buildPurchase = function (event) {
    var productAction = event.ProductAction;
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                purchase: {
                    actionField: {
                        id: productAction.TransactionId || '',
                        affiliation: productAction.Affiliation || '',
                        revenue: productAction.TotalAmount || '',
                        tax: productAction.TaxAmount || '',
                        shipping: productAction.ShippingAmount || '',
                        coupon: productAction.CouponCode || '',
                    },
                    products: buildProductsList(productAction.ProductList),
                },
            },
        },
    };
};
CommerceHandler.prototype.buildRefund = function (event) {
    // Full refunds don't require a product list on the GTM side
    // Partial refunds would include the specific items being refunded
    return {
        event: event,
        eventType: 'commerce_event',
        eventPayload: {
            ecommerce: {
                refund: {
                    actionField: {
                        id: event.ProductAction.TransactionId || '',
                    },
                    products: buildProductsList(
                        event.ProductAction.ProductList
                    ),
                },
            },
        },
    };
};

CommerceHandler.prototype.logCommerceEvent = function (event) {
    var self = this;
    var ga4CommerceEventParameters;
    switch (event.EventCategory) {
        case ProductActionTypes.AddToCart:
            ga4CommerceEventParameters = self.buildAddToCart(event);
            break;
        case ProductActionTypes.Checkout:
            ga4CommerceEventParameters = self.buildCheckout(event);
            break;
        case ProductActionTypes.CheckoutOption:
            ga4CommerceEventParameters = self.buildCheckoutOption(event);
            break;
        case ProductActionTypes.Click:
            ga4CommerceEventParameters = self.buildProductClick(event);
            break;
        case ProductActionTypes.Impression:
            try {
                event.ProductImpressions.forEach(function (impression) {
                    var ga4ImpressionEvent = self.buildImpression(
                        event,
                        impression
                    );
                    self.common.send(ga4ImpressionEvent);
                });
            } catch (error) {
                console.log('error logging impressions', error);
                return false;
            }
            return true;
        case ProductActionTypes.Purchase:
            ga4CommerceEventParameters = self.buildPurchase(event);
            break;
        case ProductActionTypes.Refund:
            ga4CommerceEventParameters = self.buildRefund(event);
            break;
        case ProductActionTypes.RemoveFromCart:
            ga4CommerceEventParameters = self.buildRemoveFromCart(event);
            break;
        case ProductActionTypes.ViewDetail:
            ga4CommerceEventParameters = self.buildProductViewDetail(event);
            break;
        case PromotionType.PromotionClick:
            ga4CommerceEventParameters = self.buildPromoClick(event);
            break;
        case PromotionType.PromotionView:
            ga4CommerceEventParameters = self.buildPromoView(event);
            break;
        default:
            console.error('Unknown Commerce Type', event);
            return false;
    }
    gtag(
        'event',
        mapGA4EcommerceEventName(event.EventCategory),
        ga4CommerceEventParameters
    );
    return true;
    /*
        Sample ecommerce event schema:
        {
            CurrencyCode: 'USD',
            DeviceId:'a80eea1c-57f5-4f84-815e-06fe971b6ef2', // MP generated
            EventAttributes: { key1: 'value1', key2: 'value2' },
            EventType: 16,
            EventCategory: 10, // (This is an add product to cart event, see below for additional ecommerce EventCategories)
            EventName: "eCommerce - AddToCart",
            MPID: "8278431810143183490",
            ProductAction: {
                Affiliation: 'aff1',
                CouponCode: 'coupon',
                ProductActionType: 7,
                ProductList: [
                    {
                        Attributes: { prodKey1: 'prodValue1', prodKey2: 'prodValue2' },
                        Brand: 'Apple',
                        Category: 'phones',
                        CouponCode: 'coupon1',
                        Name: 'iPhone',
                        Price: '600',
                        Quantity: 2,
                        Sku: "SKU123",
                        TotalAmount: 1200,
                        Variant: '64GB'
                    }
                ],
                TransactionId: "tid1",
                ShippingAmount: 10,
                TaxAmount: 5,
                TotalAmount: 1215,
            },
            UserAttributes: { userKey1: 'userValue1', userKey2: 'userValue2' }
            UserIdentities: [
                {
                    Identity: 'test@gmail.com', Type: 7
                }
            ]
        }
    */
};

// Utility function
function toUnderscore(string) {
    return string
        .split(/(?=[A-Z])/)
        .join('_')
        .toLowerCase();
}

function parseProduct(_product) {
    var product = {};

    for (var key in _product) {
        switch (key) {
            case 'Sku':
                product.item_id = _product.Sku;
                break;
            case 'Name':
                product.item_name = _product.Name;
                break;
            case 'Brand':
                product.item_brand = _product.Brand;
                break;
            case 'Category':
                product.item_category = _product.Category;
                break;
            case 'Variant':
                product.item_variant = _product.Variant;
                break;
            default:
                console.log('ok');
                product[toUnderscore(key)] = _product[key];
        }
    }

    return product;
}

function parsePromotion(_promotion) {
    var promotion = {};

    for (var key in _promotion) {
        promotion[toUnderscore(key)] = _promotion[key];
    }

    return promotion;
}

function buildProductsList(products) {
    var productsList = [];

    products.forEach(function (product) {
        productsList.push(parseProduct(product));
    });

    return productsList;
}

function buildPromoList(promotions) {
    var promotionsList = [];

    promotions.forEach(function (promotion) {
        promotionsList.push(parsePromotion(promotion));
    });

    return promotionsList;
}

function mapGA4EcommerceEventName(mpEventType) {
    switch (mpEventType) {
        case ProductActionTypes.AddToCart:
            return 'add_to_cart';
        case ProductActionTypes.RemoveFromCart:
            return 'remove_from_cart';
        case ProductActionTypes.Purchase:
            return 'purchase';
        case ProductActionTypes.Checkout:
            return 'add_to_cart';
        case ProductActionTypes.Click:
            return 'add_to_cart';
        case ProductActionTypes.CheckoutOption:
            return 'add_to_cart';
        case ProductActionTypes.Impression:
            return 'add_to_cart';
        case ProductActionTypes.Refund:
            return 'add_to_cart';
        case ProductActionTypes.ViewDetail:
            return 'add_to_cart';
        default:
            console.log('Product Action Type not supported');
            return null;
    }
}

module.exports = CommerceHandler;
