export const categories = [
  { id:'travel', name:'Travel & stays', bn:'ভ্রমণ', icon:'sun', aliases:'ভ্রমণ হোটেল কক্সবাজার সিলেট tour hotel resort cox bazar sylhet holiday' },
  { id:'automotive', name:'Cars & mobility', bn:'গাড়ি', icon:'car', aliases:'গাড়ি গাড়ি বাইক gari car auto motorcycle rental' },
  { id:'property', name:'Property', bn:'বাড়ি', icon:'building', aliases:'বাসা বাড়ি বাড়ি flat rent apartment land property' },
  { id:'home', name:'Home services', bn:'সেবা', icon:'tool', aliases:'মেরামত বাসা পরিষ্কার ac repair cleaning shifting service' },
  { id:'finance', name:'Money & insurance', bn:'ব্যাংকিং', icon:'card', aliases:'ব্যাংক বীমা ব্যাংকিং bank loan card insurance credit' },
  { id:'internet', name:'Internet & mobile', bn:'ইন্টারনেট', icon:'wifi', aliases:'ইন্টারনেট ডাটা broadband wifi mobile internet' },
  { id:'health', name:'Health & wellness', bn:'স্বাস্থ্য', icon:'heart', aliases:'স্বাস্থ্য ডাক্তার doctor health clinic fitness' },
  { id:'education', name:'Learning', bn:'শিক্ষা', icon:'book', aliases:'শিক্ষা কোর্স বই education course learning tutor' },
  { id:'shopping', name:'Shopping', bn:'কেনাকাটা', icon:'bag', aliases:'কেনাকাটা পোশাক ফ্রিজ fashion fridge appliance product shop' },
  { id:'dining', name:'Food & dining', bn:'খাবার', icon:'cup', aliases:'খাবার রেস্তোরাঁ food restaurant dining meal' },
  { id:'events', name:'Events & occasions', bn:'আয়োজন', icon:'calendar', aliases:'বিয়ে বিয়ে অনুষ্ঠান wedding venue event photography' },
  { id:'business', name:'For your business', bn:'ব্যবসা', icon:'case', aliases:'ব্যবসা অফিস business office procurement logistics printing' }
];

export function sampleCatalogue() {
  const groups = [
    ['travel','Cox’s Bazar family escape','cox-family-3n','3 nights · 2 adults','Cox’s Bazar',[23800,25900,27900],['Coastline Travel Studio','Bayfront Holiday Desk','Weekend Routes'],{Stay:'3 nights, double room',Transport:'Return AC coach from Dhaka',Meals:'Breakfast included',Cancellation:'See supplier quote',Dates:'On request; not live availability'},'coast'],
    ['automotive','Toyota Corolla Axio 2020','axio-2020','vehicle','Dhaka',[2580000,2670000,2740000],['Motorlane Dhaka','City Auto Select','Northside Motors'],{Year:'2020',Engine:'1.5L hybrid',Condition:'Used; inspection required',Transmission:'Automatic',Warranty:'Supplier-specific'},'car'],
    ['home','AC cleaning & check-up','ac-clean-1unit','one split AC','Dhaka',[1200,1450,1650],['Neighborhood Works','Homecare Collective','Repair Room'],{Scope:'Indoor + outdoor unit cleaning',Labor:'Included',Parts:'Charged separately',Scheduling:'Confirmed after request',Warranty:'7-day workmanship'},'home'],
    ['internet','Home broadband 50 Mbps','broadband-50','month','Dhaka',[900,1000,1200],['Localnet Example','District Fiber Example','Everyday Broadband Example'],{Speed:'50 Mbps advertised',Installation:'Ask provider',Coverage:'Address confirmation required',Contract:'Monthly',Router:'Not included'},'signal'],
    ['shopping','Inverter refrigerator 250L','fridge-example-250','item','Dhaka',[39900,41200,42900],['Everyday Appliances','Household Store','Goodhome Retail'],{Capacity:'250L illustrative model',Delivery:'Included in shown fee',Installation:'Standard setup',Warranty:'Confirm exact model with supplier',Condition:'New'},'home'],
    ['property','Three-bedroom home in Uttara','uttara-3bed-rental','month','Dhaka',[28000,32000,35000],['Uttara Home Desk','Open Door Property','Neighborhood Homes'],{Bedrooms:'3',Area:'1,250–1,450 sq ft; varies',Location:'Uttara, Dhaka',Deposit:'Confirm with owner',Fees:'Service charge shown separately'},'city'],
    ['dining','A family table for four','family-meal-4','four people','Dhaka',[2200,2600,2900],['The Family Table','Courtyard Kitchen','City Lunchroom'],{Guests:'4',Menu:'Set menu; dishes vary',Service:'Included in shown fee',Availability:'Reservation confirmation required'},'food'],
    ['education','Practical spoken English course','english-course-8wk','8-week course','Bangladesh',[4500,5500,6000],['Learning Room Example','Skill Circle Example','Study Desk Example'],{Duration:'8 weeks',Mode:'Online live classes',Schedule:'Confirm with provider',Certificate:'Provider-issued'},'book'],
    ['events','Wedding photography essentials','wedding-photo-1day','one event','Dhaka',[18000,24000,30000],['Stories Studio Example','Frame House Example','Daylight Team Example'],{Coverage:'6 hours',Photographers:'2',Delivery:'Edited digital gallery',Travel:'Within Dhaka'},'city'],
    ['business','Office printing essentials','print-a4-500','500 A4 pages','Dhaka',[1400,1750,2000],['Printroom Example','Office Supply Desk','Local Printworks'],{Quantity:'500 pages',Paper:'80 gsm',Color:'Black and white',Delivery:'Confirm with provider'},'book'],
    ['health','General wellness consultation','wellness-consult','consultation','Dhaka',[700,900,1200],['Wellness Desk Example','Community Health Example','Healthroom Example'],{Service:'General consultation information',Credentials:'Verify with provider',Appointment:'On request',Advice:'Not a clinical recommendation'},'home'],
    ['finance','Everyday credit card comparison','credit-card-example','annual fee','Bangladesh',[1500,2000,2500],['Example Bank A','Example Bank B','Example Bank C'],{Type:'Illustrative credit card',Eligibility:'Subject to issuer assessment',Interest:'Not included; confirm issuer terms',Fees:'Annual fee only',Disclaimer:'No real financial product or application'},'signal']
  ];
  const businesses=[],offers=[];
  const now=new Date().toISOString(), expires=new Date(Date.now()+60*86400000).toISOString();
  for(const [category,title,group,unit,location,prices,names,attributes,art] of groups) {
    prices.forEach((price,i)=>{
      const businessId=`sample-${category}-${i+1}`,ownerId=i===0?'demo-merchant':'demo-other';
      businesses.push({id:businessId,ownerId,name:names[i],category,location,description:`Illustrative ${category} provider for testing SaveSmart comparisons. This is not a real merchant partnership.`,responseHours:4+i*4});
      offers.push({id:`offer-${category}-${i+1}`,businessId,category,title,comparisonGroup:group,unit,location,price,fees:category==='travel'?1200:category==='property'?2500:category==='shopping'?500:0,rebate:i===0&&['travel','dining','shopping'].includes(category)?500:0,payment:i===0?'bKash':'Any',attributes:{...attributes,Option:['Value','Flexible','Extended'][i]},art,confirmedAt:now,expiresAt:expires});
    });
  }
  return {businesses,offers};
}
