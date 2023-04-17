import express from 'express';
import { config as dotEnvConfig } from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import { readFileSync } from 'fs';
dotEnvConfig();

const PORT = 3000;

const settings = JSON.parse(readFileSync('settings.json'));
console.log('settings:', settings);

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();

app.get('/images/*', async (req, res) => {
    const path = req.url.substring(7);

    const completion = await openai.createChatCompletion({
        model: settings.model,
        messages: [
            { role: 'system', content: settings.prompts.image },
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
        model: settings.model,
        messages: [
            { role: 'system', content: settings.prompts.default },
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