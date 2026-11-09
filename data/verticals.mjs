// Original, informational comparison schemas and decision guides for Bangladesh.
export const verticals={
  "travel": {
    "title": "Compare the whole trip.",
    "summary": "Dates, travelers and inclusions define the comparison. A room rate alone rarely describes the cost of a family trip.",
    "schema": [
      {
        "key": "dates",
        "label": "Travel dates",
        "why": "Availability, fares and cancellation rules depend on the actual dates.",
        "required": true
      },
      {
        "key": "travelers",
        "label": "Adults and children",
        "why": "Room occupancy and child rates change the total.",
        "required": true
      },
      {
        "key": "stay",
        "label": "Nights and room type",
        "why": "Compare equal duration and occupancy.",
        "required": true
      },
      {
        "key": "transport",
        "label": "Transport and transfers",
        "why": "Include coach, flight, fuel, transfers and unavoidable charges.",
        "required": true
      },
      {
        "key": "meals",
        "label": "Meals and activities",
        "why": "Make included and optional components explicit.",
        "required": true
      },
      {
        "key": "cancellation",
        "label": "Cancellation terms",
        "why": "A cheaper non-refundable offer is a different commitment.",
        "required": true
      }
    ],
    "sections": [
      [
        "Start with one shared brief",
        "Give providers the same dates, departure point, travelers, room needs and whole-trip budget. Ask them to separate included components from optional extras."
      ],
      [
        "Check the payable total",
        "Add mandatory transport, accommodation, service and transfer charges. Keep conditional card or mobile-payment rebates separate from money due now."
      ],
      [
        "Choose with the conditions visible",
        "Confirm availability, responsible suppliers, amendment rules and cancellation charges before committing. A comparison or enquiry is not a ticket or booking."
      ]
    ],
    "tools": [
      {
        "label": "Build a trip brief",
        "href": "#/travel"
      },
      {
        "label": "Ask travel providers",
        "href": "#/ask?category=travel"
      }
    ]
  },
  "automotive": {
    "title": "Compare the car and the ownership.",
    "summary": "A model name is the start. Vehicle condition, inspection and ownership costs complete the decision.",
    "schema": [
      {
        "key": "variant",
        "label": "Model and variant",
        "why": "Different engines, trims and import specifications are not identical.",
        "required": true
      },
      {
        "key": "year",
        "label": "Year and mileage",
        "why": "Age and usage affect suitability.",
        "required": true
      },
      {
        "key": "condition",
        "label": "Condition and inspection",
        "why": "A matching title does not prove mechanical equivalence.",
        "required": true
      },
      {
        "key": "charges",
        "label": "Included charges",
        "why": "Clarify transfer, registration, preparation and inspection charges.",
        "required": true
      },
      {
        "key": "ownership",
        "label": "Running-cost assumptions",
        "why": "Fuel, servicing and resale estimates need transparent assumptions.",
        "required": true
      }
    ],
    "sections": [
      [
        "Choose the correct comparison",
        "Record model, year, powertrain, mileage, condition and included charges. Inspect a specific vehicle rather than assuming that similarly named listings have equal condition."
      ],
      [
        "Look beyond the price tag",
        "Use your own mileage, fuel economy, maintenance and resale estimates in the ownership calculator. Financing, taxes, parking and unexpected repairs need separate consideration."
      ],
      [
        "Define the next service",
        "Request an inspection or workshop quote with the vehicle details and the same job scope. Separate parts, labor, travel and warranties."
      ]
    ],
    "tools": [
      {
        "label": "Estimate ownership cost",
        "href": "#/automotive"
      },
      {
        "label": "Request an automotive quote",
        "href": "#/ask?category=automotive"
      }
    ]
  },
  "property": {
    "title": "Compare the cost of making it home.",
    "summary": "Monthly rent is one part of a move. Deposits, service charges and suitability deserve equal attention.",
    "schema": [
      {
        "key": "location",
        "label": "Location and commute",
        "why": "A cheaper home may create a more expensive journey.",
        "required": true
      },
      {
        "key": "space",
        "label": "Usable space and rooms",
        "why": "Check the actual layout and usable area.",
        "required": true
      },
      {
        "key": "charges",
        "label": "Deposit and recurring charges",
        "why": "Include service charges, parking and utilities where applicable.",
        "required": true
      },
      {
        "key": "agreement",
        "label": "Agreement and availability",
        "why": "Confirm the owner, move-in date and contractual terms.",
        "required": true
      }
    ],
    "sections": [
      [
        "Create a consistent shortlist",
        "Compare usable area, rooms, location, access and actual availability. Similar asking prices do not establish equal properties."
      ],
      [
        "Price the move",
        "List deposits, service charges, movers, repairs, cleaning and setup costs. Keep refundable deposits separate from permanent expenses."
      ],
      [
        "Confirm the responsible parties",
        "Check the owner or agent authority and terms before paying. A platform listing is not proof of property title."
      ]
    ],
    "tools": [
      {
        "label": "Plan a home request",
        "href": "#/ask?category=property"
      }
    ]
  },
  "home": {
    "title": "Compare a clearly defined job.",
    "summary": "A useful service quote identifies the work, the parts and the circumstances that can change its cost.",
    "schema": [
      {
        "key": "scope",
        "label": "Work scope and unit count",
        "why": "One AC unit and a whole home are different jobs.",
        "required": true
      },
      {
        "key": "parts",
        "label": "Parts and labor",
        "why": "Separate parts, consumables and call-out charges.",
        "required": true
      },
      {
        "key": "location",
        "label": "Service area and timing",
        "why": "Travel and scheduling affect availability and fees.",
        "required": true
      },
      {
        "key": "warranty",
        "label": "Workmanship warranty",
        "why": "State coverage, duration and exclusions.",
        "required": true
      }
    ],
    "sections": [
      [
        "Describe the same job to every provider",
        "Include unit counts, equipment details, access, location and preferred timing. A few precise facts reduce incomparable quotations."
      ],
      [
        "Ask what costs extra",
        "Check labor, parts, consumables, travel, call-out and inspection fees. A zero listed fee should be an explicit supplier statement, not a missing value."
      ],
      [
        "Confirm the result and follow-up",
        "Agree completion criteria, workmanship coverage and how additional work will be approved. Keep the quote in your plan."
      ]
    ],
    "tools": [
      {
        "label": "Ask once for home services",
        "href": "#/ask?category=home"
      }
    ]
  },
  "finance": {
    "title": "Compare obligations as well as benefits.",
    "summary": "Fees, eligibility, interest and exclusions matter more than a headline reward.",
    "schema": [
      {
        "key": "eligibility",
        "label": "Eligibility",
        "why": "The provider decides whether an applicant qualifies.",
        "required": true
      },
      {
        "key": "fees",
        "label": "Fees and interest",
        "why": "Include recurring fees and applicable borrowing costs.",
        "required": true
      },
      {
        "key": "conditions",
        "label": "Benefits and exclusions",
        "why": "Understand caps, qualifying spend and renewal rules.",
        "required": true
      },
      {
        "key": "provider",
        "label": "Responsible institution",
        "why": "Use the authorized provider for an actual application.",
        "required": true
      }
    ],
    "sections": [
      [
        "Define your need",
        "Compare products for the same purpose and eligible customer profile. A public comparison is information, not approval or personalized financial advice."
      ],
      [
        "Read the full cost",
        "Check fees, interest, penalties, required spend and exclusions. Do not treat a conditional reward as guaranteed income."
      ],
      [
        "Use the responsible provider",
        "Confirm the current terms with the institution and complete any application through its authorized process."
      ]
    ],
    "tools": [
      {
        "label": "Describe your comparison need",
        "href": "#/ask?category=finance"
      }
    ]
  },
  "internet": {
    "title": "Compare the connection you can actually use.",
    "summary": "Coverage, setup costs and allowances help explain the effective cost of a plan.",
    "schema": [
      {
        "key": "coverage",
        "label": "Address coverage",
        "why": "Service must be available at your address.",
        "required": true
      },
      {
        "key": "speed",
        "label": "Speed and allowance",
        "why": "Compare advertised speed, data limits and relevant policies.",
        "required": true
      },
      {
        "key": "setup",
        "label": "Installation and equipment",
        "why": "Router, connection and setup charges affect first-year cost.",
        "required": true
      },
      {
        "key": "contract",
        "label": "Contract and renewal",
        "why": "Check duration, renewal and cancellation conditions.",
        "required": true
      }
    ],
    "sections": [
      [
        "Confirm coverage first",
        "Ask the provider about your address and installation availability. A generally advertised plan is not confirmation of service at your home."
      ],
      [
        "Calculate an effective cost",
        "Combine recurring fees with unavoidable setup and equipment charges over the same period. Separate introductory and regular prices."
      ],
      [
        "Check practical terms",
        "Read allowances, fair-use rules, support arrangements and cancellation conditions before switching."
      ]
    ],
    "tools": [
      {
        "label": "Request a connection quote",
        "href": "#/ask?category=internet"
      }
    ]
  },
  "health": {
    "title": "Find suitable care with clear information.",
    "summary": "Provider credentials, suitability and appointment information belong beside service prices.",
    "schema": [
      {
        "key": "service",
        "label": "Service scope",
        "why": "A test or consultation name must identify the actual service.",
        "required": true
      },
      {
        "key": "credentials",
        "label": "Provider credentials",
        "why": "Check the relevant professional registration.",
        "required": true
      },
      {
        "key": "availability",
        "label": "Appointment and location",
        "why": "Confirm timing, access and preparation requirements.",
        "required": true
      },
      {
        "key": "fees",
        "label": "Fees and exclusions",
        "why": "Clarify follow-up, reporting and additional service costs.",
        "required": true
      }
    ],
    "sections": [
      [
        "Identify the required service",
        "Use qualified clinical advice to decide what care is needed. A low price or popular community post does not establish medical suitability."
      ],
      [
        "Check the provider and appointment",
        "Verify credentials, location, preparation and availability with the provider."
      ],
      [
        "Understand the fee",
        "Ask about the included service, reports, follow-up and potential additional charges. SaveSmart does not diagnose or guarantee outcomes."
      ]
    ],
    "tools": [
      {
        "label": "Find provider information",
        "href": "#/products?category=health"
      }
    ]
  },
  "education": {
    "title": "Choose learning around the outcome.",
    "summary": "Duration, teaching format and credible course evidence help make a price comparison useful.",
    "schema": [
      {
        "key": "outcome",
        "label": "Learning outcome",
        "why": "Clarify what skill or qualification is actually offered.",
        "required": true
      },
      {
        "key": "format",
        "label": "Format and schedule",
        "why": "Live, recorded and in-person teaching have different value.",
        "required": true
      },
      {
        "key": "duration",
        "label": "Duration and support",
        "why": "Compare access length, contact time and support.",
        "required": true
      },
      {
        "key": "fees",
        "label": "Total fees and refund rules",
        "why": "Check materials, exam costs and cancellation conditions.",
        "required": true
      }
    ],
    "sections": [
      [
        "Start with the learning goal",
        "Choose the skill, level and format you need. Course titles alone do not establish equivalent instruction."
      ],
      [
        "Compare the actual experience",
        "Review schedule, teaching hours, materials, access duration and support. Treat provider outcome claims as claims until supported."
      ],
      [
        "Check the complete cost",
        "Include mandatory materials, exams and certificates where applicable. Confirm trial and refund conditions."
      ]
    ],
    "tools": [
      {
        "label": "Compare learning options",
        "href": "#/products?category=education"
      }
    ]
  },
  "shopping": {
    "title": "Choose the item, then choose the seller.",
    "summary": "Exact model, variant, condition and warranty determine which offers can be compared fairly.",
    "schema": [
      {
        "key": "model",
        "label": "Exact model or identifier",
        "why": "Similar names can hide different products.",
        "required": true
      },
      {
        "key": "variant",
        "label": "Variant and condition",
        "why": "Match size, capacity, color and new/used status.",
        "required": true
      },
      {
        "key": "warranty",
        "label": "Warranty route",
        "why": "Official and supplier warranties may have different coverage.",
        "required": true
      },
      {
        "key": "delivery",
        "label": "Delivery and installation",
        "why": "Include unavoidable shipping and setup charges.",
        "required": true
      },
      {
        "key": "returns",
        "label": "Returns and seller terms",
        "why": "Check the responsible seller and return conditions.",
        "required": true
      }
    ],
    "sections": [
      [
        "Match the exact item",
        "Use the model or identifier and select the same variant, capacity, condition and warranty route before comparing suppliers."
      ],
      [
        "Sort by the full payable cost",
        "Combine the base price with mandatory delivery and installation. Conditional rebates remain separate from the total."
      ],
      [
        "Use history carefully",
        "A recorded history shows observed prices, not every market price. Do not infer a historic low or typical saving from sparse observations."
      ]
    ],
    "tools": [
      {
        "label": "Compare shopping options",
        "href": "#/products?category=shopping"
      }
    ]
  },
  "dining": {
    "title": "Compare the complete table.",
    "summary": "Guests, menu, service charges and payment eligibility all change a dining offer.",
    "schema": [
      {
        "key": "guests",
        "label": "People and menu",
        "why": "Compare the same party size and meal scope.",
        "required": true
      },
      {
        "key": "fees",
        "label": "Taxes and service charges",
        "why": "Show mandatory charges in the payable total.",
        "required": true
      },
      {
        "key": "timing",
        "label": "Dates and reservation",
        "why": "Offer windows and availability may be restricted.",
        "required": true
      },
      {
        "key": "eligibility",
        "label": "Payment conditions",
        "why": "Check card/mobile-payment caps and qualifying rules.",
        "required": true
      }
    ],
    "sections": [
      [
        "Agree the menu and guest count",
        "A meal for two and a family package are not comparable units. Check included dishes and portions."
      ],
      [
        "Read the conditions",
        "Confirm dates, reservations, mandatory service charges and payment-method eligibility."
      ],
      [
        "Keep rebates conditional",
        "A payment promotion may depend on caps, minimum spend or remaining campaign eligibility. Confirm it before ordering."
      ]
    ],
    "tools": [
      {
        "label": "Explore payment offers",
        "href": "#/passport"
      }
    ]
  },
  "events": {
    "title": "Compare the event you actually want.",
    "summary": "Coverage, people, deliverables and cancellation terms define a useful event quotation.",
    "schema": [
      {
        "key": "date",
        "label": "Event date and location",
        "why": "Availability is date-specific.",
        "required": true
      },
      {
        "key": "scope",
        "label": "Coverage and guest count",
        "why": "Hours, team size and quantities affect scope.",
        "required": true
      },
      {
        "key": "deliverables",
        "label": "Deliverables",
        "why": "State the actual output, equipment or included services.",
        "required": true
      },
      {
        "key": "terms",
        "label": "Deposit and cancellation",
        "why": "Confirm payment schedule, changes and cancellation rules.",
        "required": true
      }
    ],
    "sections": [
      [
        "Write one event brief",
        "Give suppliers the same date, location, guest count, coverage hours and required deliverables."
      ],
      [
        "Compare scope line by line",
        "Check staffing, equipment, travel, editing, setup and overtime. A lower headline fee may exclude important work."
      ],
      [
        "Agree changes in writing",
        "Record deposits, delivery dates, cancellation and any change approval before committing."
      ]
    ],
    "tools": [
      {
        "label": "Request event quotations",
        "href": "#/ask?category=events"
      }
    ]
  },
  "business": {
    "title": "Make procurement comparable.",
    "summary": "Quantity, specification, delivery and support turn business enquiries into useful quotations.",
    "schema": [
      {
        "key": "specification",
        "label": "Specification and quantity",
        "why": "Use an agreed technical or service description.",
        "required": true
      },
      {
        "key": "delivery",
        "label": "Delivery and installation",
        "why": "Compare location, schedule and setup.",
        "required": true
      },
      {
        "key": "tax",
        "label": "Taxes and invoicing",
        "why": "Specify whether mandatory tax and invoicing requirements are included.",
        "required": true
      },
      {
        "key": "support",
        "label": "Support and warranty",
        "why": "Confirm responsibilities after delivery.",
        "required": true
      }
    ],
    "sections": [
      [
        "Reuse a precise specification",
        "Send the same quantities, requirements, location and timing to each supplier. Keep required invoicing and documentation explicit."
      ],
      [
        "Compare the complete offer",
        "Look at tax, delivery, installation, support and acceptance criteria alongside price."
      ],
      [
        "Retain the record",
        "Keep approved scope and provider commitments in the project plan. A platform enquiry is not a procurement contract."
      ]
    ],
    "tools": [
      {
        "label": "Request business quotations",
        "href": "#/ask?category=business"
      }
    ]
  }
};

export function guideFor(category){
  const v=verticals[category];
  if(!v)return null;
  return {id:`${category}-decisions`,category,title:v.title,summary:v.summary,sections:v.sections.map(([title,body])=>({title,body})),tools:v.tools};
}
export const guides=Object.keys(verticals).map(guideFor);
