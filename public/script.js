// @ts-check

// This field is populated by backend
window.__PAYMENT_DETAILS_STR = `{"client_secret": "", "return_url":"http://localhost:5500/public/index.html","merchant_logo":"https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg","merchant":"Steam","amount":"419.00","currency":"USD","purchased_item":"F1 '23","payment_id":"pay_42dfeb3a0ee"}`;

//Follow this doc for HTML and REST API integration: https://hyperswitch.io/docs/sdkIntegrations/unifiedCheckoutWeb/restAPIBackendAndHTMLFrontend
// Update your publishable key here
const hyper = Hyper("");
var widgets = null;

// Parse payment details
window.__PAYMENT_DETAILS = {};
try {
  window.__PAYMENT_DETAILS = JSON.parse(window.__PAYMENT_DETAILS_STR);
} catch (error) {
  console.error("Failed to parse payment details");
}

async function initialize() {
  var paymentDetails = window.__PAYMENT_DETAILS;
  var client_secret = paymentDetails.client_secret;
  const appearance = {
    // theme: "midnight",
  };

  widgets = hyper.widgets({
    appearance,
    clientSecret: client_secret,
  });

  const unifiedCheckoutOptions = {
    layout: "tabs",
    wallets: {
      walletReturnUrl: paymentDetails.return_url,
    },
  };

  const unifiedCheckout = widgets.create("payment", unifiedCheckoutOptions);
  unifiedCheckout.mount("#unified-checkout");
}
initialize();

async function handleSubmit(e) {
  setLoading(true);
  var paymentDetails = window.__PAYMENT_DETAILS;
  const { error, data, status } = await hyper.confirmPayment({
    widgets,
    confirmParams: {
      // Make sure to change this to your payment completion page
      return_url: paymentDetails.return_url,
    },
  });
  // This point will only be reached if there is an immediate error occurring while confirming the payment. Otherwise, your customer will be redirected to your `return_url`.
  // For some payment flows such as Sofort, iDEAL, your customer will be redirected to an intermediate page to complete authorization of the payment, and then redirected to the `return_url`.

  if (error) {
    if (error.type === "validation_error") {
      showMessage(error.message);
    } else {
      showMessage("An unexpected error occurred.");
    }
  } else {
    const { paymentIntent } = await hyper.retrievePaymentIntent(paymentDetails.client_secret);
    if (paymentIntent && paymentIntent.status) {
      hide("#hyper-checkout-sdk");
      hide("#hyper-checkout-details");
      show("#hyper-checkout-status");
      show("#hyper-footer");
      showStatus(paymentIntent);
    }
  }

  setLoading(false);
}

// Fetches the payment status after payment submission
async function checkStatus() {
  const clientSecret = new URLSearchParams(window.location.search).get(
    "payment_intent_client_secret"
  );
  const res = {
    showSdk: true,
  };

  if (!clientSecret) {
    return res;
  }

  const { paymentIntent } = await hyper.retrievePaymentIntent(clientSecret);

  if (!paymentIntent || !paymentIntent.status) {
    return res;
  }

  showStatus(paymentIntent);
  res.showSdk = false;

  return res;
}

function setPageLoading(showLoader) {
  if (showLoader) {
    show(".page-spinner");
  } else {
    hide(".page-spinner");
  }
}

function setLoading(showLoader) {
  if (showLoader) {
    show(".spinner");
    hide("#button-text");
  } else {
    hide(".spinner");
    show("#button-text");
  }
}

function show(id) {
  removeClass(id, "hidden");
}
function hide(id) {
  addClass(id, "hidden");
}

function showMessage(msg) {
  show("#payment-message");
  addText("#payment-message", msg);
}
function showStatus(paymentDetails) {
  const status = paymentDetails.status;
  let statusDetails = {
    imageSource: "",
    message: "",
    status: status,
    amountText: "",
    items: [],
  };

  switch (status) {
    case "succeeded":
      statusDetails.imageSource = "http://www.clipartbest.com/cliparts/4ib/oRa/4iboRa7RT.png";
      statusDetails.message = "Payment successful";
      statusDetails.status = "Succeeded";
      statusDetails.amountText = new Date(paymentDetails.created).toTimeString();

      // Payment details
      var amountNode = createItem("AMOUNT PAID", paymentDetails.currency + " " + paymentDetails.amount);
      var paymentId = createItem("PAYMENT ID", paymentDetails.payment_id);
      // @ts-ignore
      statusDetails.items.push(amountNode, paymentId);
      break;

    case "processing":
      statusDetails.imageSource = "http://www.clipartbest.com/cliparts/4ib/oRa/4iboRa7RT.png";
      statusDetails.message = "Payment in progress";
      statusDetails.status = "Processing";
      // Payment details
      var amountNode = createItem("AMOUNT PAID", paymentDetails.currency + " " + paymentDetails.amount);
      var paymentId = createItem("PAYMENT ID", paymentDetails.payment_id);
      // @ts-ignore
      statusDetails.items.push(amountNode, paymentId);
      break;

    case "failed":
      statusDetails.imageSource = "";
      statusDetails.message = "Payment failed";
      statusDetails.status = "Failed";
      // Payment details
      var amountNode = createItem("AMOUNT PAID", paymentDetails.currency + " " + paymentDetails.amount);
      var paymentId = createItem("PAYMENT ID", paymentDetails.payment_id);
      // @ts-ignore
      statusDetails.items.push(amountNode, paymentId);
      break;

    case "cancelled":
      statusDetails.imageSource = "";
      statusDetails.message = "Payment cancelled";
      statusDetails.status = "Cancelled";
      // Payment details
      var amountNode = createItem("AMOUNT PAID", paymentDetails.currency + " " + paymentDetails.amount);
      var paymentId = createItem("PAYMENT ID", paymentDetails.payment_id);
      // @ts-ignore
      statusDetails.items.push(amountNode, paymentId);
      break;

    case "requires_merchant_action":
      statusDetails.imageSource = "";
      statusDetails.message = "Payment under review";
      statusDetails.status = "Under review";
      // Payment details
      var amountNode = createItem("AMOUNT PAID", paymentDetails.currency + " " + paymentDetails.amount);
      var paymentId = createItem("PAYMENT ID", paymentDetails.payment_id);
      var paymentId = createItem("MESSAGE", "Your payment is under review by the merchant.");
      // @ts-ignore
      statusDetails.items.push(amountNode, paymentId);
      break;

    default:
      statusDetails.imageSource = "http://www.clipartbest.com/cliparts/4ib/oRa/4iboRa7RT.png";
      statusDetails.message = "Something went wrong";
      statusDetails.status = "Something went wrong";
      // Error details
      if (typeof paymentDetails.error === "object") {
        var errorCodeNode = createItem("ERROR CODE", paymentDetails.error.code);
        var errorMessageNode = createItem("ERROR MESSAGE", paymentDetails.error.message);
        // @ts-ignore
        statusDetails.items.push(errorMessageNode, errorCodeNode);
      }
      break;
  }

  // Append status
  var statusTextNode = document.getElementById("status-text");
  if (statusTextNode !== null) {
    statusTextNode.innerText = statusDetails.message;
  }

  // Append image
  var statusImageNode = document.getElementById("status-img");
  if (statusImageNode !== null) {
    statusImageNode.src = statusDetails.imageSource;
  }

  // Append status details
  var statusDateNode = document.getElementById("status-date");
  if (statusDateNode !== null) {
    statusDateNode.innerText = statusDetails.amountText;
  }

  // Append items
  var statusItemNode = document.getElementById("hyper-checkout-status-items");
  if (statusItemNode !== null) {
    statusDetails.items.map((item) => statusItemNode?.append(item));
  }
}

function createItem(heading, value) {
  var itemNode = document.createElement("div");
  itemNode.className = "hyper-checkout-item";
  var headerNode = document.createElement("div");
  headerNode.className = "hyper-checkout-item-header";
  headerNode.innerText = heading;
  var valueNode = document.createElement("div");
  valueNode.className = "hyper-checkout-item-value";
  valueNode.innerText = value;
  itemNode.append(headerNode);
  itemNode.append(valueNode);
  return itemNode;
}

function addText(id, msg) {
  var element = document.querySelector(id);
  element.innerText = msg;
}

function addClass(id, className) {
  var element = document.querySelector(id);
  element.classList.add(className);
}

function removeClass(id, className) {
  var element = document.querySelector(id);
  element.classList.remove(className);
}

function renderPaymentDetails() {
  var paymentDetails = window.__PAYMENT_DETAILS;

  // Payment details header
  var paymentDetailsHeaderNode = document.createElement("div");
  paymentDetailsHeaderNode.className = "hyper-checkout-details-header";
  paymentDetailsHeaderNode.innerText = "Payment request for " + paymentDetails.merchant;

  // Payment details
  var purchasedItemNode = createItem("PAYMENT FOR", paymentDetails.purchased_item);
  var paymentIdNode = createItem("PAYMENT ID", paymentDetails.payment_id);
  var orderAmountNode = createItem("AMOUNT PAYABLE", paymentDetails.currency + " " + paymentDetails.amount);

  // Append to PaymentDetails node
  var paymentDetailsNode = document.getElementById("hyper-checkout-details");
  if (paymentDetailsNode !== null) {
    paymentDetailsNode.append(paymentDetailsHeaderNode);
    paymentDetailsNode.append(purchasedItemNode);
    paymentDetailsNode.append(paymentIdNode);
    paymentDetailsNode.append(orderAmountNode);
  }
}

function renderSDKHeader() {
  var paymentDetails = window.__PAYMENT_DETAILS;

  // SDK header's logo
  var sdkHeaderLogoNode = document.createElement("div");
  sdkHeaderLogoNode.className = "hyper-checkout-sdk-header-logo";
  var sdkHeaderLogoImageNode = document.createElement("img");
  sdkHeaderLogoImageNode.src = paymentDetails.merchant_logo;
  sdkHeaderLogoImageNode.alt = paymentDetails.merchant;
  sdkHeaderLogoNode.append(sdkHeaderLogoImageNode);

  // SDK headers' items
  var sdkHeaderItemNode = document.createElement("div");
  sdkHeaderItemNode.className = "hyper-checkout-sdk-items";
  var sdkHeaderMerchantNameNode = document.createElement("div");
  sdkHeaderMerchantNameNode.className = "hyper-checkout-sdk-header-brand-name";
  sdkHeaderMerchantNameNode.innerText = paymentDetails.merchant;
  var sdkHeaderAmountNode = document.createElement("div");
  sdkHeaderAmountNode.className = "hyper-checkout-sdk-header-amount";
  sdkHeaderAmountNode.innerText = paymentDetails.currency + " " + paymentDetails.amount;
  sdkHeaderItemNode.append(sdkHeaderMerchantNameNode);
  sdkHeaderItemNode.append(sdkHeaderAmountNode);

  // Append to SDK header's node
  var sdkHeaderNode = document.getElementById("hyper-checkout-sdk-header");
  if (sdkHeaderNode !== null) {
    sdkHeaderNode.append(sdkHeaderLogoNode);
    sdkHeaderNode.append(sdkHeaderItemNode);
  }
}

function showSDK(e) {
  setPageLoading(true);
  checkStatus().then((res) => {
    if (res.showSdk) {
      renderPaymentDetails();
      renderSDKHeader();
      show("#hyper-checkout-sdk");
      show("#hyper-checkout-details")
    } else {
      show("#hyper-checkout-status");
      show("#hyper-footer");
    }
  }).catch((err) => {

  }).finally(() => {
    setPageLoading(false);
  })
}
