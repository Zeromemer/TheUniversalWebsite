import express from 'express';
import { config as dotEnvConfig } from 'dotenv';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
dotEnvConfig();

const PORT = 3000;

const settings = JSON.parse(readFileSync('settings.json'));
console.log('settings:', settings);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const app = express();

app.get('/images/*', async (req, res) => {
    const path = req.url.substring(7);

    const completion = await openai.chat.completions.create({
        model: settings.model,
        messages: [
            { role: 'system', content: settings.prompts.image },
            { role: 'user', content: path }
        ],
        temperature: 1.5
    });

    const prompt = completion.choices[0].message.content;

    console.log(`image ${path} prompt: ${prompt}`);

    if (!(prompt?.length)) {
        throw new Error('No prompt');
    }

    let url = '';

    if (settings.useDalle2) {
        const response = await openai.images.generate({
            prompt,
            n: 1,
            size: "256x256",
        });

        url = response.data.data[0].url;
    } else {
        url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    }

    console.log(`image ${path} url: ${url}`);
    res.redirect(url);
});

app.get('/favicon.ico', (req, res) => {
    res.status(404).send();
});

app.get('*', async (req, res) => {
    const stream = await openai.chat.completions.create({
        model: settings.model,
        messages: [
            { role: 'system', content: settings.prompts.text },
            { role: 'user', content: req.url }
        ],
        stream: true,
    });
    
    res.type('html');
    let whole = '';
    for await (const data of stream) {
        const content = data?.choices[0]?.delta?.content;
        if (content !== undefined) {
            res.write(content);
            whole += content;
        } else {
            console.log(`${req.url}: ${whole}`);
            res.end();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});