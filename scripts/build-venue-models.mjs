import {mkdirSync,writeFileSync} from 'node:fs';
import {sites,toVRML} from '../js/venue-sites-data.js';
const dir=new URL('../models/venues/',import.meta.url);mkdirSync(dir,{recursive:true});
for(const site of sites){writeFileSync(new URL(site.id+'.wrl',dir),toVRML(site));console.log('Wrote '+site.id+'.wrl');}
