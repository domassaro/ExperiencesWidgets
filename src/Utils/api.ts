import { Availability } from "../typings/Availability";
import { Cart } from "../typings/Cart";
import { CustomScripts } from "../typings/CustomScripts";
import { EventDBO } from "../typings/Event";
import { FirstAvailability } from "../typings/FirstAvailability";
import { FormField } from "../typings/CustomForm";
import { FormAttendee } from "../typings/FormAttendee";
import { OrderInputData } from "../typings/CreateOrderInput";
import { Quantities } from "../typings/Quantities";
import { SchedulerProduct } from "../typings/SchedulerProduct";
import { Variants } from "../typings/Variant";
import { sbClient } from "../shopifyBuy";
import { LineItem } from "shopify-buy";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type IHashTable<T> = {
  [key: string]: T;
};

export type ServiceError = {
  errorType: string;
  errorMessage: string;
};

export type HttpResponse<Body> = {
  statusCode: number;
  error?: ServiceError;
  body: Body;
};

export type EntitiesMap = {
  [key: string]: string;
};

type APIArguments = {
  baseUrl: string;
  shopId: string;
};

type GetProductFromSchedulerArgs = {
  productId: number;
} & APIArguments;

type GetProductFromSchedulerRequestBody = {};


type GetProductFromSchedulerResponse = SchedulerProduct;


type GetFirstAvailabilityArgs = {
  productId: number;
  startingFrom: Date;
  timespanInSeconds?: number;
} & APIArguments;

type GetFirstAvailabilityRequestBody = {
  productId: number;
  startingFrom: Date;
  timespanInSeconds: number;
};

type GetFirstAvailabilityResponse = FirstAvailability;


export type CreateOrderArgs = {
  order: OrderInputData;
} & APIArguments;

type CreateOrderRequestBody = {
  order: OrderInputData;
};

type CreateOrderResponse = {};


type GetEventArgs = {
  shopifyProductId: number;
} & APIArguments;

type GetCustomFormRequestBody = {

};

type GetEventResponse = {
  data: EventDBO;
};

type GetCustomScriptsArgs = APIArguments;

type GetCustomScriptsRequestBody = {};

type GetCustomScriptsResponse = CustomScripts;

type GetShopDetailsResponse = {
  name: string;
  moneyFormat: string;
  timezone: string;
};

export type AddToCartArgs = {
  shopUrl?: string;
  variants: Variants;
  timeslot: Availability;
  quantities: Quantities;
  fields?: FormField[];
  attendees?: FormAttendee[];
};

export enum DisableRedirect {
  /** Disable auto-nav logic for Buy SDK stuff */
  BuySdk,
  /** Disable auto-nav logic for default Shopify stuff */
  ShopifyCart,
  /** Don't disable any auto-nav logic */
  None,
}

export type AddToCartOptions = {
  /** Flag denoting whether buy sdk should be used over default add to cart logic */
  enableBuySdk?: boolean;
  /** The original event DBO object */
  event: EventDBO;
  /** Prevent auto-navigation to checkout URL */
  disableRedirect?: DisableRedirect;
  /** Callback to invoke when items have been added to cart */
  onCartAdd?(url?: string): void;
} | undefined;

type AttendeeProperties = {
  firstName: string,
  lastName: string,
  email: string,
  fields?: IHashTable<string>[];
};

type AddToCartRequestBody = {
  id: string,
  quantity: number,
  properties: IHashTable<string | AttendeeProperties[]>,
};

type AddToCartResponse = {};

type GetCartRequestBody = {};

type GetCartResponse = Cart;

/** Key = variant name & value = SDK GID */
export type SdkVariantMap = {
  [key: string]: string | number;
};

export type SdkCart = ShopifyBuy.Cart & {
  /** The checkout URL provided by Shopify -- formerly called `checkoutUrl` */
  webUrl: string;
};

export type ShopifyAttribute = {
  /** Key or name of the attribute */
  key: string;
  /** Value of the attribute */
  value?: string;
};

export type SdkLineItemInput = {
  /** Shopify product variant ID */
  variantId: string | number;
  /** Number of variants selected by customer */
  quantity: number;
  /** Array of shopify attributes for a particular variant */
  customAttributes?: ShopifyAttribute[];
};

/**
 * Generic function for mapping the responses from `sendJSON` and throw error if error present.
 */
function handleResponse<Response>(response: HttpResponse<Response>) {
  if (response.error) {
    throw new Error(`(${response.error.errorType}) ${response.error.errorMessage}`);
  } else {
    return response.body;
  }
}

/**
 * Generic function for creating XHR calls and handling the responses.
 */
export function sendJSON<RequestBody, ResponseBody>(method: HttpMethod, url: string, body?: RequestBody): Promise<HttpResponse<ResponseBody>> {
  return new Promise((accept, reject) => {
    // create the requeset object
    const xhr = new XMLHttpRequest();

    // set the method and URL target
    xhr.open(method, url, true);

    // set the content-type and accept headers
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");

    // define the onload handler for a completed connection
    xhr.onload = () => {
      try {
        let error: ServiceError | null = null;
        let response = JSON.parse(xhr.responseText);
        if (xhr.status < 200 || xhr.status > 299 || (response && response.errorType)) {
          error = response as ServiceError;
          response = null;
        }
        accept({
          statusCode: xhr.status,
          error: error,
          body: response as ResponseBody,
        });
      } catch (err) {
        reject(err);
      }
    };

    // define the error handler for an incomplete connection
    xhr.onerror = reject;

    // if we have a request body, encode it as JSON
    const requestData = typeof body === "string" ? body : JSON.stringify(body);

    // send our request
    xhr.send(requestData);
  });
}

/**
 * Fetches the schedule pattern data for the product from our API.
 */
export async function getProductFromScheduler({ baseUrl, shopId, productId }: GetProductFromSchedulerArgs): Promise<GetProductFromSchedulerResponse> {
  const res = await sendJSON<GetProductFromSchedulerRequestBody, GetProductFromSchedulerResponse>("GET", `${baseUrl}/rest/schedule?shop=${shopId}&productId=${productId}`);

  return handleResponse<GetProductFromSchedulerResponse>(res);
}

/**
 * Fetches the availability for a scheduler product from the API.
 */
export async function getFirstAvailability({ baseUrl, shopId, productId, startingFrom, timespanInSeconds }: GetFirstAvailabilityArgs): Promise<FirstAvailability> {
  const res = await sendJSON<GetFirstAvailabilityRequestBody, GetFirstAvailabilityResponse>("POST", `${baseUrl}/rest/firstAvailability?shop=${shopId}`, { productId, startingFrom, timespanInSeconds });

  return handleResponse<GetFirstAvailabilityResponse>(res);
}

/**
 * Creates an order with the customer information
 */
export async function createOrder({ baseUrl, shopId, order }: CreateOrderArgs): Promise<CreateOrderResponse> {
  const res = await sendJSON<CreateOrderRequestBody, CreateOrderResponse>("POST", `${baseUrl}/rest/createOrder?shop=${shopId}`, { order });

  return handleResponse<CreateOrderResponse>(res);
}

/**
 * Fetches data from remService in order to build the custom order details form
 */
export async function getEvent({ baseUrl, shopId, shopifyProductId }: GetEventArgs): Promise<GetEventResponse> {
  const res = await sendJSON<GetCustomFormRequestBody, GetEventResponse>("GET", `${baseUrl}/rest/event/?shop=${shopId}&productId=${shopifyProductId}`);

  return handleResponse<GetEventResponse>(res);
}

/**
 * Gets custom scripts
 */
export async function getCustomScripts({ baseUrl, shopId }: GetCustomScriptsArgs): Promise<GetCustomScriptsResponse> {
  const res = await sendJSON<GetCustomScriptsRequestBody, GetCustomScriptsResponse>("GET", `${baseUrl}/rest/shopSettings?shop=${shopId}&fields=customScripts&fields=trackingPixelUrl`);

  return handleResponse<GetCustomScriptsResponse>(res);
}

/**
 * Gets custom scripts
 */
export async function getShopDetails({ baseUrl, shopId }: APIArguments): Promise<GetShopDetailsResponse> {
  const res = await sendJSON<APIArguments, GetShopDetailsResponse>("GET", `${baseUrl}/rest/shop?shop=${shopId}`);

  return handleResponse<GetShopDetailsResponse>(res);
}

/**
 * Adds the an event product to the cart with the selected quantity
 * and the date/time of the event.
 */
export async function addToCart(
  { timeslot, quantities, fields, attendees, shopUrl }: AddToCartArgs,
  { 
    enableBuySdk, 
    event: { handle, variants: eventVariants },
    disableRedirect = DisableRedirect.None,
    onCartAdd, 
  }: AddToCartOptions,
): Promise<void> {
  // Extract "When" string from timeslot
  const When: string = timeslot.formattedTimeslot.when;
  
  /**
   * If client is *not* in Shopify-land, we'll need to utilize the Shopify Buy SDK to add
   * items to cart & navigate to checkout.
   */
  if (enableBuySdk) {
    try {
      // Create an SDK cart
      const sdkCart = await sbClient.checkout.create();
      // Fetch product so we have a source of those dang GIDs
      const sdkProduct = await sbClient.product.fetchByHandle(handle);
      // Key = variant name/title & value = variant GID
      const sdkVariantMap: SdkVariantMap = {};
      // List of gql variants
      const sdkVariants = sdkProduct.variants;

      // Populate variant map to fetch variant GIDs (Shopify's GraphQL IDs for the variants)
      for (let i = 0; i < sdkVariants.length; i++) {
        const sdkVariant = sdkVariants[i];
        sdkVariantMap[sdkVariant.title] = sdkVariant.id;
      }

      // Populate formatted SDK/Shopify-approved line items list
      const sdkLineItems: SdkLineItemInput[] = [];

      // For per-attendee events
      if (Array.isArray(attendees) && attendees.length > 0) {
        for (const attendee of attendees) {
          const customAttributes: ShopifyAttribute[] = [
            { key: "When", value: When },
            { key: "Name", value: `${attendee.firstName} ${attendee.lastName}` },
            { key: "Email", value: attendee.email },
          ];

          if (Array.isArray(attendee.fields)) {
            for (let field of attendee.fields) {
              customAttributes.push({
                key: field.label,
                value: field.value,
              }); 
            }
          }
        }


        // TODO: Find out how to get variant GID from attendee variant ID


      }
      // For all other events
      else {
        // Store custom attributes ()
        const customAttributes: ShopifyAttribute[] = [];

        if (Array.isArray(fields)) {
          for (const field of fields) {
            customAttributes.push({
              key: field.label,
              value: field.value,
            });
          }
        }

        for (let j = 0; j < eventVariants.length; j++) {
          const v = eventVariants[j];
          sdkLineItems.push({
            variantId: sdkVariantMap[v.name],
            quantity: quantities[v.shopifyVariantId],
            customAttributes,
          });
        }
      }

      await sbClient.checkout.addLineItems(sdkCart.id, sdkLineItems as unknown as LineItem[]);

      // Navigate to checkout URL
      if (onCartAdd && disableRedirect !== DisableRedirect.BuySdk) {
        onCartAdd((sdkCart as unknown as SdkCart).webUrl);
      }
    }
    catch (err) {
      console.error(`There was an error utilizing the Shopify Buy SDK: ${err}`);
    }
  }
  /**
   * The following logic should be the default (ie: most cases), where the client is in
   * Shopify-land and the Buy SDK will *not* be utilized.
   */ 
  else {
    // Store request bodies in array to shoot off sequentially later
    const requests: AddToCartRequestBody[] = [];

    // If attendees exist, each will become separate line items
    if (Array.isArray(attendees) && attendees.length > 0) {
      for (let attendee of attendees) {
        const properties: IHashTable<string> = {
          When,
          Name: `${attendee.firstName} ${attendee.lastName}`,
          Email: attendee.email,
        };

        if (Array.isArray(attendee.fields)) {
          for (let field of attendee.fields) {
            properties[field.label] = field.value;
          }
        }

        requests.push({
          id: attendee.variantId.toString(),
          quantity: 1,
          properties,
        });
      }
    }
    // Otherwise, each variant will be its own line item
    else {
      const properties: IHashTable<string> = { When };

      if (Array.isArray(fields)) {
        for (let field of fields) {
          properties[field.label] = field.value;
        }
      }

      for (let variantId in quantities) {
        requests.push({
          id: variantId,
          quantity: quantities[variantId],
          properties,
        });
      }
    }

    const cartUrl = shopUrl ? `${shopUrl}/cart/add.js` : "/cart/add.js";

    for (let request of requests) {
      let error: Error | null = null;
      let count = 0;
      do {
        try {
          await sendJSON<AddToCartRequestBody, AddToCartResponse>("POST", cartUrl, request);
          error = null;
        } catch (err) {
          error = err;
        }
        count++;
      } while (error && count < 3);

      if (error) {
        console.error("Failed to add an item to the cart after multiple attempts.", request);
        throw error;
      }
    } 

    // Invoke callback (typically to navigate us to checkout URL)
    if (onCartAdd && disableRedirect !== DisableRedirect.ShopifyCart) {
      onCartAdd();
    }
  }  
}

/**
 * Gets the current cart content
 */
export async function getCart(shopUrl?: string): Promise<GetCartResponse> {
  const cartUrl = shopUrl ? `${shopUrl}/cart.js` : "/cart.js";
  const res = await sendJSON<GetCartRequestBody, GetCartResponse>("GET", cartUrl);

  return handleResponse<GetCartResponse>(res);
}

/**
 * Fetches the products with availability between two given dates.
 */
export async function fetchProductsWithAvailability(baseUrl: string, shop: any, startsAt: Date, endsAt: Date): Promise<any> {
  endsAt.setHours(23, 59, 59, 999);
  let res = await sendJSON<any, any[]>("POST", `${baseUrl}/rest/productsAvailability?shop=${shop}`, { startsAt, endsAt });
  if (res.error) {
    throw new Error(`(${res.error.errorType}) ${res.error.errorMessage}`);
  } else {
    return res.body;
  }
}