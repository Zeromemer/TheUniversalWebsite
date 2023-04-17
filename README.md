# TheUniversalWebsite

TheUniversalWebsite is a website that uses Node.js and Express.js to generate content for each request using GPT-3.5.  
[Major inspiration](https://youtu.be/M2uH6HnodlM)

## Setup
1. Create a file called `.env` and inside put:
```
OPENAI_KEY={YOUR API KEY}
```
but replace {YOUR API KEY} with your API key [provided to you by OpenAI](https://platform.openai.com/)

2. Run the following command in your terminal
```
npm i
```
and if you don't have typescript installed also run
```
npm install -g typescript
```
3. Run with the command
```
npm run start
```