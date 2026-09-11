import {env} from 'cloudflare:workers';
export function getVotesDb(){if(!env.DB)throw Error('Database unavailable');return env.DB;}
