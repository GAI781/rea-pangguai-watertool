import {inspectEntry} from './entry.js';
// Evidence: official scanCodeInit and pages_skip. Verified with REA 6.8.0.
// The official service still decides device type, account access and payment.
export function buildOfficialAlipayEntry(raw){
 const entry=inspectEntry(raw);
 if(!entry.officialEligible)throw Error('此码仅支持原始入口；不可丢弃来源或官方附加分流参数');
 const query=`masterSwitch=0&keepUsing=1&${entry.markerType}=${encodeURIComponent(entry.marker)}`;
 return `alipays://platformapi/startapp?appId=2018072460764274&page=${encodeURIComponent('pages/skipNew/skipNew')}&query=${encodeURIComponent(query)}`;
}
