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
        temperature: 1
    });

    const prompt = completion.data.choices[0].message?.content;

    console.log(`image ${path} prompt: ${prompt}`);

    if (!(prompt?.length)) {
        throw new Error('No prompt');
    }

    let url = '';

    if (settings.useDalle2) {
        const response = await openai.createImage({
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
    const completion = await openai.createChatCompletion({
        model: settings.model,
        messages: [
            { role: 'system', content: settings.prompts.text },
            { role: 'user', content: req.url }
        ],
        stream: true,
    }, { responseType: 'stream' });
    
    res.type('html');
    let whole = '';
    completion.data.on('data', data => {
        const lines = data.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            const message = line.replace(/^data: /, '');
            if (message === '[DONE]') {
                console.log(`${req.url}: ${whole}`);
                res.end();
                return;
            }
            const parsed = JSON.parse(message);
    
            whole += parsed.choices[0].delta.content ?? "";
            res.write(parsed.choices[0].delta.content ?? "");
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});