/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const http = require('http');

function httpGet(options) {
  return new Promise(((resolve, reject) => {
    const request = http.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';    
      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }    
      response.on('data', (chunk) => {
        returnData += chunk;
      });    
      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });    
      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
}

const GetNewQuoteIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'GetNewQuoteIntent');
  },
  async handle(handlerInput) {
    
    var options = {
      "method": "GET",
      "hostname": "store.apicultur.io",
      "port": null,
      "path": "/api/mezclaRefran/1.0.0",
      "headers": {
        "cache-control": "no-cache",
        "Authorization": "Bearer "+process.env.APICULTUR_KEY
      }
    };
    const response = await httpGet(options);
    
    const refranMezclado = [response.refran1.parte1, response.refran2.parte2].join(" ");
    
    const speechOutput = refranMezclado;
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withSimpleCard(SKILL_NAME, refranMezclado)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(STOP_MESSAGE)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Lo siento, ha ocurrido un error, pero ahí va un refrán: De la cuenta que da el pastor, sólo el monte sabe el error.')
      .reprompt('Lo siento, ha ocurrido un error, pero ahí va un refrán: De la cuenta que da el pastor, sólo el monte sabe el error.')
      .getResponse();
  },
};

const SKILL_NAME = 'Refranero Divertido';
const GET_FACT_MESSAGE = 'Ahí va un refrán divertido: ';
const HELP_MESSAGE = 'Puedes pedirme un refrán o salir... Con qué te puedo ayudar?';
const HELP_REPROMPT = 'Con qué te puedo ayudar?';
const STOP_MESSAGE = 'Hasta luego!';

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    GetNewQuoteIntent,
    HelpHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

