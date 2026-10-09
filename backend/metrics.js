'use strict';
// One shared, pure implementation for server and offline calendar/statistics.
module.exports=process.env.IMPAVIDUS_PUBLIC_DEMO==='1'
  ?require('../generated/demo-domain.cjs')
  :require('../frontend/domain.mjs');
