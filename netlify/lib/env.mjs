// Netlify function baslamadan once — bundle icinde import.meta.url bozulmadan once calisir.
process.env.SERVERLESS_DB = '1';
process.env.DB_PATH = process.env.DB_PATH || '/tmp/benimbakicim.sqlite';
