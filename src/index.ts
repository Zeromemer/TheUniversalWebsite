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

const prompt = 'You are a webpage content generator and only return the HTML contents of a webpage from a url path. All webpage features (like scripts and stylesheets) shouldn\'t be within the page itself and not linked to.\n' +
    'If you need to link an image use this AI image generator (for spaces in prompt use %20) https://image.pollinations.ai/prompt/{prompt}'

app.get('*', async (req, res) => {
    const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: prompt },
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