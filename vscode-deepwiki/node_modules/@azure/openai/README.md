# Azure OpenAI client library for JavaScript

The Azure OpenAI client library for JavaScript is an adaptation of OpenAI's REST APIs that provides an idiomatic interface
and rich integration with the rest of the Azure SDK ecosystem. It can connect to Azure OpenAI resources *or* to the
non-Azure OpenAI inference endpoint, making it a great choice for even non-Azure OpenAI development.

Use the client library for Azure OpenAI to:

* [Create a chat completion with ChatGPT][stream_chat_completion_sample]
* [Create a vector embedding for text][get_embeddings_sample]
* [Use your own data with Azure OpenAI][byod_sample]
* [Generate images][get_images_sample]
* [Transcribe and Translate audio files][transcribe_audio_sample]
* [Create a legacy completion for text][get_completions_sample]

Azure OpenAI is a managed service that allows developers to deploy, tune, and generate content from OpenAI models on Azure resources.

Checkout the following examples:

- [Multiple Completions](#generate-multiple-completions-with-subscription-key)
- [Chatbot](#generate-chatbot-response)
- [Summarize Text](#summarize-text-with-completion)
- [Use Chat Tools](#use-chat-tools)
- [Generate Images](#generate-images-with-dall-e-image-generation-models)
- [Analyze Business Data](#analyze-business-data)
- [Transcribe and Translate audio files](#transcribe-and-translate-audio-files)
- [Chat with images using gpt-4-vision-preview](#chat-with-images-using-gpt-4-vision-preview)

Key links:

- [Source code](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/openai/openai)
- [Package (NPM)](https://www.npmjs.com/package/@azure/openai)
- [API reference documentation](https://aka.ms/openai-js-api)
- [Product documentation](https://learn.microsoft.com/azure/cognitive-services/openai)
- [Samples](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/openai/openai/samples/v1-beta)

## Getting started

```javascript
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const client = new OpenAIClient(
  "https://<resource name>.openai.azure.com/", 
  new AzureKeyCredential("<Azure API key>")
);
const { id, created, choices, usage } = await client.getCompletions("<deployment ID>", ["YOUR PROMPT HERE"]);
```

### Currently supported environments

- [LTS versions of Node.js](https://github.com/nodejs/release#release-schedule)
- Latest versions of Safari, Chrome, Edge, and Firefox.

### Prerequisites

If you'd like to use an Azure OpenAI resource, you must have an [Azure subscription](https://azure.microsoft.com/free/dotnet/)
and [Azure OpenAI access](https://learn.microsoft.com/azure/cognitive-services/openai/overview#how-do-i-get-access-to-azure-openai).
This will allow you to create an Azure OpenAI resource and get both a connection URL as well as API keys. For more
information, see [Quickstart: Get started generating text using Azure OpenAI Service](https://learn.microsoft.com/azure/cognitive-services/openai/quickstart).

If you'd like to use the Azure OpenAI JS client library to connect to non-Azure OpenAI, you'll need an API key
from a developer account at https://platform.openai.com/.

### Install the `@azure/openai` package

Install the Azure OpenAI client client library for JavaScript with `npm`:

```bash
npm install @azure/openai
```

### Create and authenticate a `OpenAIClient`

To configure a client for use with Azure OpenAI, provide a valid endpoint URI to an Azure OpenAI resource
along with a corresponding key credential, token credential, or Azure identity credential that's authorized to use the
Azure OpenAI resource. To instead configure the client to connect to OpenAI's service, provide an API key from OpenAI's
developer portal.

#### Using an API Key from Azure

Use the [Azure Portal][azure_portal] to browse to your OpenAI resource and retrieve an API key, or use the [Azure CLI][azure_cli] snippet below:

**Note:** Sometimes the API key is referred to as a "subscription key" or "subscription API key."

```PowerShell
az cognitiveservices account keys list --resource-group <your-resource-group-name> --name <your-resource-name>
```

Once you have an API key and endpoint, you can use the `AzureKeyCredential` class to authenticate the client as follows:

```javascript
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

const client = new OpenAIClient("<endpoint>", new AzureKeyCredential("<API key>"));
```

#### Using an Azure Active Directory Credential

Client API key authentication is used in most of the examples, but you can also authenticate with Azure Active Directory using the [Azure Identity library][azure_identity]. To use the [DefaultAzureCredential][defaultazurecredential] provider shown below,
or other credential providers provided with the Azure SDK, please install the `@azure/identity` package:

```bash
npm install @azure/identity
```

You will also need to [register a new AAD application][register_aad_app] and grant access to OpenAI by assigning the `"Cognitive Services User"` role to your service principal (note: other roles such as `"Owner"` will not grant the necessary permissions, only `"Cognitive Services User"` will suffice to run the examples and the sample code).

Set the values of the client ID, tenant ID, and client secret of the AAD application as environment variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`.

```javascript
const { OpenAIClient } = require("@azure/openai");
const { DefaultAzureCredential } = require("@azure/identity");

const client = new OpenAIClient("<endpoint>", new DefaultAzureCredential());
```

#### Using an API Key from OpenAI

To instead configure the client to connect to OpenAI's service, provide an API key from OpenAI's
developer portal. Once you have an API key, you can use the `OpenAIKeyCredential` class to authenticate the client as follows:

```javascript
const { OpenAIClient, OpenAIKeyCredential } = require("@azure/openai");

const client = new OpenAIClient(new OpenAIKeyCredential("<API key>"));
```

## Key concepts

The main concept to understand is [Completions][azure_openai_completions_docs]. Briefly explained, completions provides its functionality in the form of a text prompt, which by using a specific [model](https://learn.microsoft.com/azure/cognitive-services/openai/concepts/models), will then attempt to match the context and patterns, providing an output text. The following code snippet provides a rough overview:

```javascript
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

async function main(){
  const client = new OpenAIClient(
  "https://your-azure-openai-resource.com/",
  new AzureKeyCredential("your-azure-openai-resource-api-key"));

  const { choices } = await client.getCompletions(
    "text-davinci-003", // assumes a matching model deployment or model name
    ["Hello, world!"]);

  for (const choice of choices) {
    console.log(choice.text);
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

## Examples

You can familiarize yourself with different APIs using [Samples](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/openai/openai/samples/v1-beta).

### Generate Chatbot Response

This example authenticates using a DefaultAzureCredential, then generates chat responses to input chat question and messages.

```javascript
const { OpenAIClient } = require("@azure/openai");
const { DefaultAzureCredential } = require("@azure/identity");

async function main(){
  const endpoint = "https://myaccount.openai.azure.com/";
  const client = new OpenAIClient(endpoint, new DefaultAzureCredential());

  const deploymentId = "gpt-35-turbo";

  const messages = [
    { role: "system", content: "You are a helpful assistant. You will talk like a pirate." },
    { role: "user", content: "Can you help me?" },
    { role: "assistant", content: "Arrrr! Of course, me hearty! What can I do for ye?" },
    { role: "user", content: "What's the best way to train a parrot?" },
  ];

  console.log(`Messages: ${messages.map((m) => m.content).join("\n")}`);

  const events = await client.streamChatCompletions(deploymentId, messages, { maxTokens: 128 });
  for await (const event of events) {
    for (const choice of event.choices) {
      const delta = choice.delta?.content;
      if (delta !== undefined) {
        console.log(`Chatbot: ${delta}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

### Generate Multiple Completions With Subscription Key

This example generates text responses to input prompts using an Azure subscription key

```javascript
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

async function main(){
  // Replace with your Azure OpenAI key
  const key = "YOUR_AZURE_OPENAI_KEY";
  const endpoint = "https://myaccount.openai.azure.com/";
  const client = new OpenAIClient(endpoint, new AzureKeyCredential(key));

  const examplePrompts = [
    "How are you today?",
    "What is Azure OpenAI?",
    "Why do children love dinosaurs?",
    "Generate a proof of Euler's identity",
    "Describe in single words only the good things that come into your mind about your mother.",
  ];

  const deploymentName = "text-davinci-003";

  let promptIndex = 0;
  const { choices } = await client.getCompletions(deploymentName, examplePrompts);
  for (const choice of choices) {
    const completion = choice.text;
    console.log(`Input: ${examplePrompts[promptIndex++]}`);
    console.log(`Chatbot: ${completion}`);
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

### Summarize Text with Completion

This example generates a summarization of the given input prompt.

```javascript
const { OpenAIClient } = require("@azure/openai");
const { DefaultAzureCredential } = require("@azure/identity")

async function main(){
  const endpoint = "https://myaccount.openai.azure.com/";
  const client = new OpenAIClient(endpoint, new DefaultAzureCredential());

  const textToSummarize = `
    Two independent experiments reported their results this morning at CERN, Europe's high-energy physics laboratory near Geneva in Switzerland. Both show convincing evidence of a new boson particle weighing around 125 gigaelectronvolts, which so far fits predictions of the Higgs previously made by theoretical physicists.

    ""As a layman I would say: 'I think we have it'. Would you agree?"" Rolf-Dieter Heuer, CERN's director-general, asked the packed auditorium. The physicists assembled there burst into applause.
  :`;

  const summarizationPrompt = [`
    Summarize the following text.

    Text:
    """"""
    ${textToSummarize}
    """"""

    Summary:
  `];

  console.log(`Input: ${summarizationPrompt}`);

  const deploymentName = "text-davinci-003";

  const { choices } = await client.getCompletions(deploymentName, summarizationPrompt, {
    maxTokens: 64
  });
  const completion = choices[0].text;
  console.log(`Summarization: ${completion}`);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

### Use chat tools

**Tools** extend chat completions by allowing an assistant to invoke defined functions and other capabilities in the
process of fulfilling a chat completions request. To use chat tools, start by defining a function tool:

```js
const getCurrentWeather = {
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"],
        },
      },
      required: ["location"],
    },
  };
```

With the tool defined, include that new definition in the options for a chat completions request:

```js
const deploymentName = "gpt-35-turbo-1106";
const messages = [{ role: "user", content: "What is the weather like in Boston?" }];
const options = {
    tools: [
      {
        type: "function",
        function: getCurrentWeather,
      },
    ],
  };
const events = client.getChatCompletions(deploymentId, messages, options);
```

When the assistant decides that one or more tools should be used, the response message includes one or more "tool
calls" that must all be resolved via "tool messages" on the subsequent request. This resolution of tool calls into
new request messages can be thought of as a sort of "callback" for chat completions.

```js
// Purely for convenience and clarity, this function handles tool call responses.
function applyToolCall({ function: call, id }) {
    if (call.name === "get_current_weather") {
      const { location, unit } = JSON.parse(call.arguments);
      // In a real application, this would be a call to a weather API with location and unit parameters
      return {
        role: "tool",
        content: `The weather in ${location} is 72 degrees ${unit} and sunny.`,
        toolCallId: id,
      }
    }
    throw new Error(`Unknown tool call: ${call.name}`);
}
```

To provide tool call resolutions to the assistant to allow the request to continue, provide all prior historical
context -- including the original system and user messages, the response from the assistant that included the tool
calls, and the tool messages that resolved each of those tools -- when making a subsequent request.

```js
const choice = result.choices[0];
const responseMessage = choice.message;
if (responseMessage?.role === "assistant") {
  const requestedToolCalls = responseMessage?.toolCalls;
  if (requestedToolCalls?.length) {
    const toolCallResolutionMessages = [
      ...messages,
      responseMessage,
      ...requestedToolCalls.map(applyToolCall),
    ];
    const result = await client.getChatCompletions(deploymentName, toolCallResolutionMessages);
    // continue handling the response as normal
  }
}
```

### Generate images with DALL-E image generation models

This example generates batch images from a given input prompt.

```js
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

async function main() {
  const endpoint = "https://myaccount.openai.azure.com/";
  const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

  const deploymentName = "dalle-3";
  const prompt = "a monkey eating a banana";
  const size = "1024x1024";
  const n = 1;
  
  const results = await client.getImages(deploymentName, prompt, { n, size });

  for (const image of results.data) {
    console.log(`Image generation result URL: ${image.url}`);
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

### Analyze Business Data

This example generates chat responses to input chat questions about your business data. The business data is provided through an Azure Cognitive Search index. To learn more about how to setup an Azure Cognitive Search index as a data source, see [Quickstart: Chat with Azure OpenAI models using your own data][msdocs_quickstart_byod].


```javascript
const { OpenAIClient } = require("@azure/openai");
const { DefaultAzureCredential } = require("@azure/identity");

async function main(){
  const endpoint = "https://myaccount.openai.azure.com/";
  const client = new OpenAIClient(endpoint, new DefaultAzureCredential());

  const deploymentId = "gpt-35-turbo";

  const messages = [
    { role: "user", content: "What's the most common customer feedback about our product?" },
  ];

  console.log(`Messages: ${messages.map((m) => m.content).join("\n")}`);

  const events = await client.streamChatCompletions(deploymentId, messages, { 
    maxTokens: 128,
    azureExtensionOptions: {
      extensions: [
        {
          type: "AzureCognitiveSearch",
          endpoint: "<Azure Cognitive Search endpoint>",
          key: "<Azure Cognitive Search admin key>",
          indexName: "<Azure Cognitive Search index name>",
        },
      ],
    },
  });
  for await (const event of events) {
    for (const choice of event.choices) {
      const delta = choice.delta?.content;
      if (delta !== undefined) {
        console.log(`Chatbot: ${delta}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

### Transcribe and translate audio files

The speech to text and translation capabilities of Azure OpenAI can be used to transcribe and translate a wide variety of audio file formats. The following example shows how to use the `getAudioTranscription` method to transcribe audio into the language the audio is in. You can also translate and transcribe the audio into English using the `getAudioTranslation` method.

The audio file can be loaded into memory using the NodeJS file system APIs. In the browser, the file can be loaded using the `FileReader` API and the output of `arrayBuffer` instance method can be passed to the `getAudioTranscription` method.

```js
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const fs = require("fs/promises");

async function main() {
  console.log("== Transcribe Audio Sample ==");

  const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
  const deploymentName = "whisper";
  const audio = await fs.readFile("< path to an audio file >");
  const result = await client.getAudioTranscription(deploymentName, audio);

  console.log(`Transcription: ${result.text}`);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
```

### Chat with images using gpt-4-vision-preview

The `gpt-4-vision-preview` model allows you to use images as input components into chat completions.

To do this, provide distinct content items on the user message(s) for the chat completions request:

```js
const url = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
const deploymentName = "gpt-4-1106-preview";
const messages: ChatRequestMessage[] = [{role: "user", content: [{
  type: "image_url",
  imageUrl: {
    url,
    detail: "auto"
  }
}]}];
```

Chat Completions will then proceed as usual, though the model may report the more informative `finish_details` in lieu
of `finish_reason`:

```js
const result = await client.getChatCompletions(deploymentName, messages);
console.log(`Chatbot: ${result.choices[0].message?.content}`);
```

## Troubleshooting

### Logging

Enabling logging may help uncover useful information about failures. In order to see a log of HTTP requests and responses, set the `AZURE_LOG_LEVEL` environment variable to `info`. Alternatively, logging can be enabled at runtime by calling `setLogLevel` in the `@azure/logger`:

```javascript
const { setLogLevel } = require("@azure/logger");

setLogLevel("info");
```

For more detailed instructions on how to enable logs, you can look at the [@azure/logger package docs](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/core/logger).

<!-- LINKS -->
[get_completions_sample]: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples/v1-beta/javascript/completions.js
[stream_chat_completion_sample]: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples/v1-beta/javascript/streamChatCompletions.js
[byod_sample]: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples/v1-beta/javascript/bringYourOwnData.js
[get_images_sample]: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples/v1-beta/javascript/getImages.js
[transcribe_audio_sample]: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples-dev/audioTranscription.ts
[get_embeddings_sample]: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/openai/openai/samples-dev/getEmbeddings.ts
[azure_openai_completions_docs]: https://learn.microsoft.com/azure/cognitive-services/openai/how-to/completions
[defaultazurecredential]: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity#defaultazurecredential
[azure_identity]: https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity/identity
[register_aad_app]: https://docs.microsoft.com/azure/cognitive-services/authentication#assign-a-role-to-a-service-principal
[azure_cli]: https://docs.microsoft.com/cli/azure
[azure_portal]: https://portal.azure.com
[msdocs_quickstart_byod]: https://learn.microsoft.com/azure/ai-services/openai/use-your-data-quickstart
