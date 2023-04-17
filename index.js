import express from 'express';
import { config as dotEnvConfig } from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
dotEnvConfig();

const PORT = 3000;

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

const prompts = {
    default: 'You are a webpage content generator. You are given a URL path and respond with the HTML code of the webpage.\n' +
    'All images are in the /images/ folder.\n' +
    'All webpage features (like scripts and stylesheets) shouldn\'t be within the page itself and not linked to.\n' +
    'ONLY RESPOND WITH HTML!',
    image: 'You are an AI image prompt generator, you are given a url for an image, and must create a very short description for an image to be generated.'
};

app.get('/images/*', async (req, res) => {
    const path = req.url.substring(7);

    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: prompts.image },
            { role: 'user', content: path }
        ],
        temperature: .95
    });

    const prompt = completion.data.choices[0].message?.content;

    console.log(`image ${path} prompt: ${prompt}`);

    if (!(prompt?.length)) {
        throw new Error('No prompt');
    }

    res.redirect(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
});

app.get('/favicon.ico', (req, res) => {
    res.status(404).send();
});

app.get('*', async (req, res) => {
    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: prompts.default },
            { role: 'user', content: req.url }
        ],
    });
    const response = completion.data.choices[0].message?.content;

    console.log(`${req.url}: ${response}`);

    res.send(response);
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});