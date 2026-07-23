/* ═══════════════════════════════════════════════════════════════
   DopaCart — data.js
   The marketplace catalog: categories, products, options,
   coupons, drivers, review generators. Prices in Saudi Riyals.
   Product names reference real brands for flavor; nothing is
   actually sold. Photos are hotlinked from their sources
   (BASED Bodyworks, Apple, Wikimedia, Unsplash — see Credits).
   ═══════════════════════════════════════════════════════════════ */

DC.data = (() => {
  const { hash, seededRand, daySeed, pickSeeded } = DC.util;

  const VERSION = "1.8.0";

  /* Image URL helpers */
  const un = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;
  const wm = (path) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;
  const based = (file) => `https://cdn.shopify.com/s/files/1/0666/0125/5141/files/${file}`;
  const ap = (path) => `https://www.apple.com/${path}`;

  /* ── Categories ─────────────────────────────────────────── */
  const CATEGORIES = [
    {
      id: "gaming", name: "Gaming", emoji: "🎮", tagline: "Level up your setup",
      grad: ["#2b0a3d", "#c81d5e"],
      pal: [["#31104f", "#7a2ce0"], ["#0e2a52", "#2f6bff"], ["#3d0f24", "#e0356b"], ["#101c3a", "#5e5ce6"]],
      subs: ["PC Gaming", "PlayStation", "Xbox", "Nintendo", "Sim Racing", "VR", "Streaming", "Accessories"],
      boiler: "Tournament-grade gear for people who take 'one more game' very literally.",
    },
    {
      id: "hair", name: "Hair Care", emoji: "💇", tagline: "BASED Bodyworks — the gold standard",
      grad: ["#0b3a3a", "#2bb8a3"],
      pal: [["#0d3b36", "#27b0a0"], ["#123a5c", "#38a3e0"], ["#31255c", "#8f6fe8"], ["#3a2a10", "#d4a24e"]],
      subs: ["Styling", "Wash", "Treatment", "Curls"],
      boiler: "From BASED Bodyworks — no parabens, no sulfates, full ingredient transparency. Simple, effective, BASED.",
    },
    {
      id: "fashion", name: "Fashion", emoji: "👕", tagline: "Drip, delivered",
      grad: ["#3a0f2e", "#e05297"],
      pal: [["#3a0f2e", "#d6488b"], ["#101c3a", "#4a6cf7"], ["#2e2010", "#c99a3f"], ["#132e22", "#39b678"]],
      subs: ["Clothing", "Shoes", "Accessories"],
      boiler: "The classics that never miss, in the sizes your imagination always stocks.",
    },
    {
      id: "apple", name: "Apple", emoji: "🍎", tagline: "The whole ecosystem",
      grad: ["#17171c", "#7d7d88"],
      pal: [["#1a1a20", "#5c5c66"], ["#101828", "#3a6ea8"], ["#221a10", "#a08850"], ["#1a2420", "#4a8a70"]],
      subs: ["iPhone", "iPad", "Mac", "Watch", "Vision", "Audio", "Accessories"],
      boiler: "Straight from the fictional Apple Store — pick your storage and size, skip the queue.",
    },
    {
      id: "tech", name: "Technology", emoji: "📱", tagline: "Tomorrow's gadgets, today-ish",
      grad: ["#0a1f3d", "#1f8fff"],
      pal: [["#0c2242", "#2f80ed"], ["#161a3a", "#7a5cff"], ["#0d3336", "#22b8c9"], ["#26102e", "#a44ae0"]],
      subs: ["Mobile", "Audio", "Power", "Smart Home", "Cameras"],
      boiler: "Flagship specs, fictional checkout. Ships with a cable you'll lose immediately.",
    },
    {
      id: "fitness", name: "Fitness", emoji: "🏋️", tagline: "Gains, guaranteed*",
      grad: ["#0d3320", "#2fbf71"],
      pal: [["#0e341f", "#2cae66"], ["#0c2e3e", "#2b9fc9"], ["#332a0e", "#c9a12b"], ["#33110e", "#d05438"]],
      subs: ["Equipment", "Gear", "Recovery"],
      boiler: "*Guarantee void everywhere. Results depend on actually going to the gym, which we cannot ship.",
    },
    {
      id: "food", name: "Food & Drinks", emoji: "🍕", tagline: "Cravings, conquered",
      grad: ["#3d1607", "#f26b1d"],
      pal: [["#3d1607", "#e8641c"], ["#3a0d12", "#d63a4a"], ["#332a0e", "#d9a21b"], ["#132e1a", "#3aa85c"]],
      subs: ["Meals", "Desserts", "Drinks", "Snacks"],
      boiler: "Your favorite spots, delivered fictionally hot. Zero calories, because it never arrives.",
    },
    {
      id: "home", name: "Home", emoji: "🏠", tagline: "Make your space glow",
      grad: ["#2e1d0a", "#e0a53a"],
      pal: [["#2e1f0c", "#cf9a35"], ["#12283a", "#3d8fc9"], ["#152e18", "#48a85e"], ["#2b1230", "#a052c9"]],
      subs: ["Lighting", "Decor", "Kitchen", "Storage"],
      boiler: "Interior-designer approved. Some assembly imaginarily required.",
    },
    {
      id: "auto", name: "Automotive", emoji: "🚗", tagline: "Treat your ride",
      grad: ["#161d26", "#5b7fa6"],
      pal: [["#151c26", "#4f759e"], ["#26100e", "#c94f38"], ["#101f30", "#2e7fc0"], ["#1e2410", "#8fa62b"]],
      subs: ["Care", "Gadgets", "Interior"],
      boiler: "Fits every make and model, because nothing ever actually ships. Garage-tested in theory.",
    },
    {
      id: "office", name: "School & Office", emoji: "📚", tagline: "Organized chaos, organized",
      grad: ["#141b3d", "#5866e0"],
      pal: [["#141b3d", "#5460d1"], ["#0f2e33", "#2ba3ad"], ["#2e1a10", "#c06a35"], ["#25102e", "#9a4ac0"]],
      subs: ["Paper", "Tools", "Carry", "Desk"],
      boiler: "Productivity not included but strongly implied. Pairs well with pretending to take notes.",
    },
    {
      id: "pets", name: "Pets", emoji: "🐾", tagline: "Spoil the goodest boys & girls",
      grad: ["#3a1e0a", "#e0872a"],
      pal: [["#3a1e0a", "#d6822a"], ["#12283a", "#3d8fc9"], ["#152e18", "#48a85e"], ["#2b1230", "#a052c9"]],
      subs: ["Dogs", "Cats", "Aquarium"],
      boiler: "For companions who can't shop for themselves. Tails wag and purrs engage — fictionally.",
    },
    {
      id: "toys", name: "Toys & Games", emoji: "🧸", tagline: "Play has no age limit",
      grad: ["#2b0a3d", "#e0356b"],
      pal: [["#31104f", "#7a2ce0"], ["#0e2a52", "#2f6bff"], ["#3d0f24", "#e0356b"], ["#332a0e", "#c9a12b"]],
      subs: ["Building", "Board Games", "Plush", "RC", "Puzzles"],
      boiler: "Serotonin in physical form. Batteries and imagination sold separately.",
    },
    {
      id: "outdoors", name: "Outdoors", emoji: "🏕️", tagline: "The great fictional outdoors",
      grad: ["#0d3320", "#2fbf71"],
      pal: [["#0e341f", "#2cae66"], ["#0c2e3e", "#2b9fc9"], ["#332a0e", "#c9a12b"], ["#33110e", "#d05438"]],
      subs: ["Camping", "Hiking", "Cooling", "Water"],
      boiler: "Gear for adventures you'll mostly take on Instagram. Weatherproof, fiction-proof.",
    },
  ];

  /* ── Products ───────────────────────────────────────────── */
  // [name, price(SAR), emoji, sub, badges[], blurb, img, hairTypes?, options?]
  // options: { GroupName: [[label, priceDelta], …] } — first entry is the base.
  const DEFS = {
    gaming: [
      ["Sony PlayStation 5", 2299, "🎮", "PlayStation", ["bestseller", "hot"], "The white monolith itself. Load times so short you'll miss the loading screens. Almost.", un("1606813907291-d86efa9b94db")],
      ["Razer BlackWidow V4 Pro", 899, "⌨️", "PC Gaming", ["trending"], "Clicky switches, macro keys, and enough RGB to be seen from orbit.", un("1547394765-185e1e68f34e")],
      ["Logitech G Pro X Superlight 2", 549, "🖱️", "PC Gaming", ["bestseller"], "60 grams of pure aim. If you still miss, that one's on you.", un("1527814050087-3793815479db")],
      ["SteelSeries QcK Heavy XXL", 149, "🌌", "Accessories", ["new"], "A desk-sized runway for your mouse. Stitched edges, zero drag, infinite vibes.", un("1629429408209-1f912961dbd8")],
      ["Alienware 27 Gaming Monitor", 2499, "📺", "PC Gaming", ["staff"], "240Hz of buttery frames. You'll blame lag on yourself for once.", un("1593640408182-31c70c8268f5")],
      ["Xbox Elite Series 2 Controller", 699, "🎮", "Xbox", ["trending"], "Swappable paddles, trigger stops, and grip rated for rage-quit resistance.", wm("thumb/6/67/Microsoft-Xbox-One-controller.jpg/960px-Microsoft-Xbox-One-controller.jpg")],
      ["Logitech G29 Driving Force", 1099, "🏎️", "Sim Racing", ["limited"], "Force feedback strong enough to make you apologize to the curb you clipped.", wm("thumb/e/ed/Logitech_G29_steering_wheel.jpg/960px-Logitech_G29_steering_wheel.jpg")],
      ["Meta Quest 3", 2199, "🥽", "VR", ["new", "hot"], "Mixed reality so good your living room will never feel big enough again.", wm("thumb/a/af/Meta_Quest_3_display_unit.jpg/960px-Meta_Quest_3_display_unit.jpg")],
      ["Secretlab Titan Evo", 1899, "💺", "Accessories", ["bestseller"], "Lumbar support engineered for 9-hour sessions you said would be 'one quick game'.", un("1598550476439-6847785fcea6")],
      ["HyperX Cloud II", 349, "🎧", "Streaming", ["trending"], "Hear footsteps before they happen. Mic so clean your team can't mute you.", un("1599669454699-248893623440")],
      ["Govee RGB Light Bars", 249, "🌈", "Accessories", ["new"], "Sixteen million colors. You will use exactly one: red.", un("1550745165-9bc0b252726f")],
      ["Blue Yeti USB Microphone", 599, "🎙️", "Streaming", ["staff"], "Podcast-grade voice for someone who mostly says 'behind you, BEHIND YOU'.", un("1590602847861-f357a9332bbc")],
      ["Nintendo Switch OLED", 1399, "🕹️", "Nintendo", ["limited"], "Handheld joy with a screen that makes everything look like dessert.", un("1578303512597-81e6cc155b3e")],
    ],
    hair: [
      ["BASED Sea Salt Spray", 77, "🌊", "Styling", ["bestseller"], "Instant fluffy, beachy look — the beach without the sand or the seagull incident.", based("jahdlsjka.png"), ["straight", "wavy", "fine"]],
      ["BASED Texture Powder", 77, "🪶", "Styling", ["trending"], "Instant texture & volume. Gravity has been notified.", based("Cover_e9100643-2f19-4d0a-bfac-902b72e4c1d9.png"), ["fine", "oily", "straight"]],
      ["BASED Hair Clay", 92, "🪨", "Styling", ["bestseller"], "Matte texture & strong hold. Your hair, but with opinions.", based("tts-hairclay.png"), ["straight", "wavy", "thick", "oily"]],
      ["BASED Pomade", 92, "🎩", "Styling", [], "Slick, structured, vaguely mysterious. Comes with imaginary jazz.", based("h_fdks.png"), ["straight", "thick"]],
      ["BASED Curl Cream", 77, "☁️", "Curls", ["trending"], "Frizz surrenders. Curls clump, bounce, and behave like they signed a contract.", based("CurlCream-WebsiteCover.png"), ["curly", "coily", "dry", "frizzy"]],
      ["BASED Curl Mousse", 77, "🌀", "Curls", [], "Weightless definition with none of the crunch. Volume included.", based("CM-01-L.png"), ["curly", "wavy", "fine"]],
      ["BASED Curl Gel", 77, "💠", "Curls", [], "Hold that lasts the whole day. Humidity has been formally dismissed.", based("CG-01.png"), ["curly", "coily", "thick"]],
      ["BASED Curl Refresh Spray", 77, "🌸", "Curls", ["new"], "Day-two curls, resurrected in thirty seconds flat.", based("CRS-01-L.png"), ["curly", "coily", "frizzy"]],
      ["BASED Leave-In Conditioner", 77, "💧", "Treatment", ["staff"], "All-day hydration that makes split ends file for retirement.", based("LeaveIn-WebsiteCover.png"), ["dry", "damaged", "frizzy", "curly"]],
      ["BASED Shampoo", 107, "🫧", "Wash", ["bestseller"], "Clean, healthy hair & scalp — resets your head to factory settings.", based("1_Shampoo_-_Cover.png"), ["oily", "fine", "straight", "wavy"]],
      ["BASED Conditioner", 107, "🧴", "Wash", [], "Silk-mode for your strands. Detangles arguments before they start.", based("1_Conditioner_-_Cover.png"), ["dry", "damaged", "thick", "coily"]],
      ["BASED Hair Elixir", 96, "✨", "Treatment", ["hot"], "A few drops of shine, softness, and main-character energy.", based("HE-01-OCT232.png"), ["damaged", "dry", "frizzy", "curly"]],
    ],
    fashion: [
      ["Nike Tech Fleece Hoodie", 549, "🥷", "Clothing", ["bestseller"], "The hoodie that made sweatpants a lifestyle. Pockets deep enough for your secrets.", un("1556821840-3a63f95609a7")],
      ["Adidas Samba OG", 499, "👟", "Shoes", ["trending"], "The shoe that survived every trend cycle since 1949. Yes, people will ask.", wm("thumb/f/fa/Adidas_Samba_OG.jpg/960px-Adidas_Samba_OG.jpg")],
      ["Nike Air Force 1 '07", 449, "👟", "Shoes", ["bestseller"], "White-on-white perfection. Keeping them clean is the real endgame.", wm("thumb/7/7e/Nike_air_Force_1_white_on_white.jpg/960px-Nike_air_Force_1_white_on_white.jpg")],
      ["Levi's Trucker Jacket", 349, "🧥", "Clothing", ["limited"], "The denim jacket every movie protagonist owns. Now it's your turn.", un("1551537482-f2075a1d41f2")],
      ["Levi's 501 Original", 299, "👖", "Clothing", [], "The blueprint. 150 years of fit checks can't be wrong.", un("1542272604-787c3835535d")],
      ["Fossil Blue Steel Chronograph", 649, "⌚", "Accessories", ["staff"], "Steel bracelet, blue dial, and the quiet confidence of someone always on time.", un("1523170335258-f5ed11844a49")],
      ["Ray-Ban Original Wayfarer", 649, "🕶️", "Accessories", ["trending"], "Worn by icons since 1956. Makes every parking lot look like a movie scene.", un("1572635196237-14b3f281503f")],
      ["Gucci GG Marmont Crossbody", 8999, "👜", "Accessories", ["limited"], "Quilted leather, gold hardware, and the confidence of someone who doesn't check price tags.", un("1548036328-c9fa89d128fa")],
      ["New Era 59FIFTY Cap", 179, "🧢", "Accessories", ["new"], "Structured crown, flat brim, instant credibility.", un("1521369909029-2afed882baee")],
      ["Cuban Link Chain 18K", 449, "📿", "Accessories", [], "Gold-toned links with main-character shine. Fictionally hypoallergenic.", un("1599643478518-a784e5dc4c8f")],
      ["Birkenstock Arizona", 449, "🩴", "Shoes", ["hot"], "Cork soles that mold to your feet. Comfort so real it transcends the fiction.", un("1603487742131-4160ec999306")],
    ],
    apple: [
      ["iPhone 17 Pro Max", 5399, "📱", "iPhone", ["hot", "bestseller"], "The biggest, longest-lasting iPhone ever made. Your pocket will adjust.", ap("v/iphone-17-pro/g/images/meta/iphone-17-pro_overview__eumhhclcpuaa_og.png"), null,
        { Color: [["Cosmic Orange", 0], ["Deep Blue", 0], ["Silver", 0]], Storage: [["256GB", 0], ["512GB", 500], ["1TB", 1400], ["2TB", 3200]] }],
      ["iPhone 17 Pro", 4699, "📱", "iPhone", ["trending"], "Pro cameras, pro chip, pro everything — minus the Max wingspan.", ap("v/iphone-17-pro/g/images/meta/iphone-17-pro_overview__eumhhclcpuaa_og.png"), null,
        { Color: [["Cosmic Orange", 0], ["Deep Blue", 0], ["Silver", 0]], Storage: [["256GB", 0], ["512GB", 500], ["1TB", 1400]] }],
      ["iPhone 17", 3399, "📱", "iPhone", ["bestseller"], "All the essentials, none of the compromises. The people's iPhone.", ap("v/iphone-17/g/images/meta/iphone-17_overview__cg0rlzmbhl7m_og.png"), null,
        { Color: [["Black", 0], ["White", 0], ["Mist Blue", 0], ["Sage", 0], ["Lavender", 0]], Storage: [["256GB", 0], ["512GB", 500]] }],
      ["iPhone Air", 4199, "📱", "iPhone", ["new", "hot"], "Impossibly thin. You'll keep checking your pocket to make sure it's there.", ap("v/iphone-air/g/images/meta/iphone-air_overview__dwhg6l117yqa_og.png"), null,
        { Color: [["Sky Blue", 0], ["Space Black", 0], ["Cloud White", 0], ["Light Gold", 0]], Storage: [["256GB", 0], ["512GB", 500], ["1TB", 1400]] }],
      ["iPad Pro", 4199, "📲", "iPad", ["staff"], "M-series power in a slab of glass thinner than your excuses for buying it.", ap("v/ipad-pro/aw/images/meta/ipad-pro_overview__bu4cql27diaa_og.png"), null,
        { Color: [["Space Black", 0], ["Silver", 0]], Size: [["11-inch", 0], ["13-inch", 1300]], Storage: [["256GB", 0], ["512GB", 400], ["1TB", 1500], ["2TB", 3000]] }],
      ["iPad Air", 2499, "📲", "iPad", ["trending"], "The sweet spot. Powerful enough for everything, light enough for anywhere.", ap("v/ipad-air/ah/images/meta/ipad-air_overview__bc2fd15uec0y_og.png"), null,
        { Color: [["Space Gray", 0], ["Blue", 0], ["Purple", 0], ["Starlight", 0]], Size: [["11-inch", 0], ["13-inch", 800]], Storage: [["128GB", 0], ["256GB", 400], ["512GB", 800], ["1TB", 1600]] }],
      ["iPad mini", 2099, "📲", "iPad", [], "Full iPad brain, paperback body. The one-handed doomscroll champion.", ap("v/ipad-mini/v/images/meta/ipad-mini_overview__cxipvq7fs1ci_og.png"), null,
        { Color: [["Space Gray", 0], ["Blue", 0], ["Purple", 0], ["Starlight", 0]], Storage: [["128GB", 0], ["256GB", 400], ["512GB", 800]] }],
      ["iPad 11-inch (A16)", 1449, "📲", "iPad", ["bestseller"], "The entry ticket to the ecosystem. Students and note-takers, assemble.", ap("v/ipad-11/d/images/meta/ipad-11_overview__brh97xhhd8b6_og.png"), null,
        { Color: [["Silver", 0], ["Blue", 0], ["Pink", 0], ["Yellow", 0]], Storage: [["128GB", 0], ["256GB", 350], ["512GB", 750]] }],
      ["Apple Vision Pro", 14999, "🥽", "Vision", ["limited", "hot"], "Spatial computing strapped to your face. Reality, but with a settings menu.", ap("v/apple-vision-pro/k/images/meta/apple-vision-pro-us__f28gp8ey4vam_og.png"), null,
        { Storage: [["256GB", 0], ["512GB", 800], ["1TB", 1600]] }],
      ["MacBook Air", 4399, "💻", "Mac", ["bestseller"], "Fanless, silent, and faster than laptops twice its price. The default answer.", ap("v/macbook-air/z/images/meta/macbook_air_mx__ez5y0k5yy7au_og.png"), null,
        { Color: [["Sky Blue", 0], ["Midnight", 0], ["Starlight", 0], ["Silver", 0]], Size: [["13-inch", 0], ["15-inch", 800]], Storage: [["256GB", 0], ["512GB", 800], ["1TB", 1600]] }],
      ["MacBook Pro", 6999, "💻", "Mac", ["staff"], "The one the pros actually use. Battery life measured in workdays, not hours.", ap("v/macbook-pro/ax/images/meta/macbook-pro__difvbgz1plsi_og.png"), null,
        { Color: [["Space Black", 0], ["Silver", 0]], Size: [["14-inch", 0], ["16-inch", 2000]], Storage: [["512GB", 0], ["1TB", 800], ["2TB", 2400]] }],
      ["Apple Watch Series 11", 1699, "⌚", "Watch", ["trending"], "Closes your rings, reads your heart, and politely tells you to stand up.", ap("v/apple-watch-series-11/c/images/meta/apple-watch-series-11__cim89z1i9spe_og.png"), null,
        { Color: [["Jet Black", 0], ["Silver", 0], ["Rose Gold", 0], ["Space Gray", 0]], Size: [["42mm", 0], ["46mm", 130]] }],
      ["Apple Watch Ultra 3", 3399, "⌚", "Watch", ["hot"], "Built for oceans and mountains. Worn mostly to meetings. No judgment.", ap("v/apple-watch-ultra-3/b/images/meta/apple-watch-ultra-3__y7lxayrwmlem_og.png"), null,
        { Color: [["Natural Titanium", 0], ["Black Titanium", 0]] }],
      ["Apple Watch SE 3", 999, "⌚", "Watch", ["new"], "The essentials on your wrist without the flagship price tag.", ap("v/apple-watch-se-3/b/images/meta/apple-watch-se-3__d0wwc67lzg02_og.png"), null,
        { Color: [["Midnight", 0], ["Starlight", 0]], Size: [["40mm", 0], ["44mm", 120]] }],
      ["AirPods Pro 3", 999, "🎵", "Audio", ["bestseller"], "Noise cancellation strong enough to mute an entire open office.", ap("v/airpods-pro/s/images/meta/og__c0ceegchesom_overview.png")],
      ["AirPods Max 2", 2299, "🎧", "Audio", [], "Over-ear luxury with a carrying case nobody understands. Sounds incredible though.", ap("v/airpods-max/k/images/meta/airpods-max_overview__c2mz40a3bugm_og.png"), null,
        { Color: [["Midnight", 0], ["Starlight", 0], ["Blue", 0], ["Purple", 0], ["Orange", 0]] }],
      ["AirTag (4-Pack)", 449, "📍", "Accessories", [], "Attach to keys, wallet, remote, and your sense of direction.", ap("v/airtag/g/images/meta/og__ck3n0k1jl6j6.png")],
      ["HomePod mini", 449, "🔮", "Accessories", [], "A grapefruit-sized speaker that runs your whole imaginary smart home.", ap("v/homepod-mini/j/images/meta/homepod-mini__bnxwvz5xrtpy_og.png"), null,
        { Color: [["White", 0], ["Midnight", 0], ["Blue", 0], ["Orange", 0], ["Yellow", 0]] }],
      ["Apple Studio Display", 6499, "🖥️", "Mac", ["staff"], "5K glass so sharp you'll see pixels in your dreams. Speakers hiding a whole cinema.", ap("v/studio-display/f/images/meta/studio-display_overview__cc7vair07fjm_og.png")],
    ],
    tech: [
      ["Samsung Galaxy Tab S9", 2999, "📲", "Mobile", [], "Laptop power, couch energy. The S Pen attaches magnetically and vanishes mysteriously.", un("1544244015-0df4b3ffc6b0")],
      ["Anker Nano II 65W", 149, "⚡", "Power", ["new"], "Charges your laptop, phone, and buds at once. Smaller than a plum.", un("1709236709044-159f627b7971")],
      ["Anker PowerCore 20K", 199, "🔋", "Power", ["bestseller"], "Twenty thousand milliamps between you and 1% panic.", un("1609091839311-d5365f9ff1c5")],
      ["JBL Charge 5", 649, "🔊", "Audio", ["trending"], "Room-filling sound in every direction. Neighbors become fans, involuntarily.", un("1608043152269-423dbba4e7e1")],
      ["Sony α7 IV", 9999, "📷", "Cameras", ["staff"], "Full-frame magic. Your food pics are about to get a gallery show.", un("1516035069371-29a1b244cc32")],
      ["Philips Vintage LED Bulb", 89, "💡", "Smart Home", [], "Edison glow without the Edison electricity bill. Instant cozy.", un("1565814329452-e1efa11c5b89")],
      ["DJI Mini 4 Pro", 3299, "🛸", "Cameras", ["limited"], "4K aerial shots and a return-home button for when you panic. You will panic.", wm("thumb/2/2f/DJI_Mavic_Pro.jpg/960px-DJI_Mavic_Pro.jpg")],
    ],
    fitness: [
      ["BlenderBottle Classic 28oz", 79, "🥤", "Gear", [], "Leak-proof, whisk ball included, survives being thrown in gym bags and moods.", un("1593095948071-474c5cc2989d")],
      ["Bowflex SelectTech 552", 2199, "🏋️", "Equipment", ["bestseller"], "5 to 52 lbs with one twist. An entire rack living under your bed.", un("1517836357463-d25dfeac3438")],
      ["Fit Simplify Resistance Bands", 99, "🪢", "Equipment", [], "Five tension levels from 'warm-up' to 'why did I buy these'.", un("1598289431512-b97b0917affc")],
      ["Under Armour Undeniable Duffel", 249, "🧳", "Gear", [], "Ventilated shoe pocket, wet pouch, and room for gear you'll definitely use.", un("1547949003-9792a18a2601")],
      ["HydroJug Pro 1-Gallon", 129, "🚰", "Gear", ["trending"], "Time markers guilt-trip you into hydration, hour by hour.", un("1602143407151-7111542de6e8")],
      ["Nike Pegasus 41", 599, "🏃", "Gear", ["hot"], "The workhorse of running shoes. PRs voluntary but statistically likely.", un("1542291026-7eec264c27ff")],
      ["Manduka PRO Yoga Mat", 499, "🧘", "Recovery", ["trending"], "Extra thick, zero slip. Ideal for yoga, stretching, and lying down dramatically.", un("1544367567-0f2fcb009e0b")],
      ["TriggerPoint GRID Roller", 179, "🪵", "Recovery", [], "Hurts so good. Your IT band will write you a thank-you note eventually.", un("1600881333168-2ef49b341f30")],
      ["Fitbit Charge 6", 649, "📈", "Gear", ["new"], "Counts steps, reps, and streaks. Judges you silently but supportively.", un("1579721840641-7d0e67f1204e")],
      ["Harbinger Lifting Kit", 99, "🧤", "Equipment", [], "Straps, wraps, and grip for days. Calluses sold separately.", un("1526506118085-60ce8714f8c5")],
    ],
    food: [
      ["Albaik 10-Pc Chicken Meal", 27, "🍗", "Meals", ["bestseller", "hot"], "The national treasure. Garlic sauce included, patience at the branch not required.", un("1562967914-608f82629710")],
      ["Herfy Big Herfy Meal", 24, "🍔", "Meals", ["trending"], "The hometown double-decker that never left the group chat's top three.", un("1568901346375-23c9450c58cd")],
      ["Kudu Chicken Fillet", 19, "🥪", "Meals", [], "The sandwich that raised a generation of road-trippers.", un("1606755962773-d324e0a13086")],
      ["Shawarmer Classic Shawarma", 14, "🌯", "Meals", [], "Garlic paste, crispy edges, wrapped tighter than your schedule.", un("1529006557810-274b9b2fc783")],
      ["Half Million Spanish Latte", 22, "☕", "Drinks", ["staff"], "Sweet, smooth, and responsible for half the city's energy.", un("1541167760496-1628856ab772")],
      ["Barn's Signature Cappuccino", 16, "🤎", "Drinks", [], "The Saudi coffee run classic. Foam art may cause feelings.", un("1509042239860-f550ce710b93")],
      ["Krispy Kreme Original Dozen", 42, "🍩", "Desserts", ["trending"], "Twelve glazed reasons the hot light is the best traffic signal in town.", un("1551024601-bec78aea704b")],
      ["Baskin-Robbins 2-Scoop", 18, "🍨", "Desserts", [], "31 flavors, one impossible decision, zero regrets.", un("1497034825429-c343d7c6a68f")],
      ["Domino's Pepperoni Large", 39, "🍕", "Meals", [], "Cheese pull rated 9.7 by the fictional judges.", un("1513104890138-7c749659a591")],
      ["Dunkin' Iced Spanish Latte", 15, "🧋", "Drinks", ["new"], "Cold, creamy, and gone before you reach the car.", un("1461023058943-07fcbe16d735")],
      ["Subway Chicken Teriyaki", 21, "🥖", "Meals", [], "Footlong, double cheese, toasted — you know the ritual.", un("1509722747041-616f39b57569")],
      ["Honey Butter Croissant", 12, "🥐", "Desserts", ["staff"], "Seventy-two layers of laminated joy. Flake radius: two meters.", un("1555507036-ab1f4038808a")],
    ],
    home: [
      ["Govee LED Strip 5m", 129, "💫", "Lighting", ["bestseller"], "Music-sync mode turns your room into the aurora borealis, localized entirely in your room.", un("1500067318459-77a2667d9c54")],
      ["Xiaomi Mi Desk Lamp Pro", 149, "🪔", "Lighting", [], "Infinite dimming and an arc that looks like modern art.", un("1507473885765-e6ed057f782c")],
      ["Monstera Deliciosa Plant", 89, "🪴", "Decor", ["staff"], "Thrives on neglect and compliments. Big-leaf energy included.", un("1614594975525-e45190c55d0b")],
      ["Lounge Accent Armchair", 899, "🛋️", "Decor", ["bestseller"], "The reading chair that becomes the everything chair within a week.", un("1567016432779-094069958ea5")],
      ["Neon Wall Art Sign", 299, "🖼️", "Decor", [], "LED glow that makes any wall the main character.", un("1563089145-599997674d42")],
      ["IKEA KALLAX Shelf Unit", 399, "🗄️", "Storage", [], "Eight cubes that turn chaos into 'aesthetic minimalism'.", un("1594620302200-9a762244a156")],
      ["Philips Airfryer XXL", 899, "🍳", "Kitchen", ["trending"], "Crispy everything, zero guilt, one appliance now responsible for 80% of your meals.", un("1556909114-f6e7ad7d3136")],
      ["Chemex Pour-Over Set", 349, "🫖", "Kitchen", [], "Glass-hourglass coffee and the moral high ground over pod machines.", un("1648081596668-beccca435ddd")],
      ["Vitruvi Stone Diffuser", 249, "🕯️", "Decor", [], "Ultrasonic mist plus 'Rainy Bookstore' oil. Your room, but cinematic.", un("1608571423902-eed4a5ad8108")],
      ["Braun Classic Alarm Clock", 199, "🕰️", "Decor", ["limited"], "Dieter Rams design. Waking up is still bad, but it looks incredible.", un("1563861826100-9cb868fdbe1c")],
    ],
    auto: [
      ["Meguiar's Complete Detail Kit", 249, "🧽", "Care", [], "Foam cannon, microfiber army, and a shine that resets your car to showroom.", un("1520340356584-f9917d1eea6f")],
      ["Baseus A2 Pro Car Vacuum", 179, "🌪️", "Gadgets", [], "Cordless cyclone that finds fries from road trips you don't remember taking.", un("1638639756421-d1d8b04bd8d9")],
      ["Little Trees Black Ice 3-Pack", 25, "🌲", "Interior", ["new"], "Smells like a forest that also went to design school.", un("1764788127543-f7b59ef09783")],
      ["iOttie MagSafe Car Mount", 129, "🧲", "Gadgets", ["bestseller"], "Snaps on one-handed at a red light. Holds through potholes and questionable playlists.", un("1759256243611-502772ac391b")],
      ["70mai A800S Dash Cam", 449, "📹", "Gadgets", ["staff"], "4K front and rear witness. Night vision sharp enough to read regret.", un("1449965408869-eaa3f722e40d")],
      ["WeatherTech FloorLiner Set", 599, "🛞", "Interior", [], "Laser-measured fit. Contains spills, mud, and juice box incidents.", un("1760818078878-6948eb2fc2cf")],
      ["Michelin Digital Tire Inflator", 199, "🎈", "Gadgets", [], "Auto-stops at target PSI. The low-pressure light fears you now.", un("1694532438941-06bb0d95dae5")],
      ["Govee Car Underglow Kit", 229, "🚗", "Interior", ["limited"], "App-controlled glow. Technically street-legal in the fictional universe.", un("1544636331-e26879cd4d9b")],
      ["Turtle Wax Ceramic Spray", 89, "✨", "Care", [], "Water beads so hard it looks like CGI. Lasts six imaginary months.", un("1708805282695-ef186db20192")],
      ["Amazon Basics Trunk Organizer", 99, "🕸️", "Interior", [], "Groceries stay upright. The rogue orange era is over.", un("1722843646530-0ec625b8e34f")],
    ],
    office: [
      ["Moleskine Classic Notebook", 119, "📓", "Paper", [], "The notebook of Hemingway and Picasso. Your grocery lists are in good company.", un("1531346878377-a5be20888e57")],
      ["Pilot G2 Gel Pens (12)", 59, "🖊️", "Tools", ["bestseller"], "0.5mm lines so smooth your handwriting gets a promotion.", un("1583485088034-697b5bc54ccd")],
      ["JanSport Right Pack", 249, "🎒", "Carry", ["trending"], "The suede-bottom classic that survived every school year since forever.", un("1553062407-98eeb64c6a62")],
      ["Casio FX-991EX ClassWiz", 129, "🧮", "Tools", [], "Solves everything except word problems about trains.", un("1587145820266-a5951ee6f620")],
      ["UGREEN Monitor Stand", 159, "🗂️", "Desk", [], "Raises your screen and your posture's self-esteem. Drawer included.", un("1593642632823-8f785ba67e45")],
      ["Post-it Notes Cube", 25, "🗒️", "Paper", ["new"], "800 neon sticky notes. Your monitor bezel is about to become a mosaic.", un("1586281380349-632531db7ed4")],
      ["Rocketbook Core Smart Notebook", 149, "✒️", "Tools", ["limited"], "Write, scan, erase, repeat. One notebook forever, allegedly.", un("1517842645767-c639042777db")],
      ["String Shelf Desk Riser", 189, "🪜", "Desk", [], "Scandinavian minimalism for the six chapsticks you own apparently.", un("1518455027359-f3f8164ba6bd")],
      ["Pomodoro Focus Timer", 99, "⏲️", "Desk", ["staff"], "Flip for 25 minutes of pure focus. Procrastination hates this one trick.", un("1501139083538-0139583c060f")],
      ["Moleskine Weekly Planner", 99, "📅", "Paper", [], "Weekly spreads, habit trackers, and one guilt-free skipped week.", un("1506784983877-45594efa4cbe")],
    ],
    pets: [
      ["Furbo 360° Dog Camera", 549, "📷", "Dogs", ["hot"], "Tosses treats and catches the zoomies on camera while you're away.", un("1608113240010-e76286118bf2")],
      ["PetSafe Smart Feeder", 399, "🍽️", "Dogs", ["bestseller"], "Portions meals on schedule so the guilt-trip eyes finally lose their power.", un("1714068691210-073dc52c6c1d")],
      ["KONG Classic Chew Toy", 45, "🦴", "Dogs", ["trending"], "Indestructible rubber that outlasts every 'this time for sure' toy.", un("1535294435445-d7249524ef2e")],
      ["Deluxe Cat Tree Tower", 449, "🐈", "Cats", ["bestseller"], "A carpeted skyscraper for a landlord who pays rent exclusively in naps.", un("1601758065893-25c11bfa69b5")],
      ["Self-Cleaning Litter Box", 1299, "🚽", "Cats", ["limited"], "Scoops itself so you never make eye contact with the task again.", un("1727510160238-3c17eb5e6120")],
      ["Aqueon 20-Gallon Aquarium", 399, "🐠", "Aquarium", ["staff"], "A glass box of calm. Fish sold separately in the fictional pet aisle.", un("1711539137981-ddf32f60c77b")],
    ],
    toys: [
      ["LEGO Icons Collector Set", 899, "🧱", "Building", ["bestseller", "hot"], "Thousands of bricks and a manual you'll pretend not to need.", un("1644175897056-50f4d3a9a827")],
      ["Catan Board Game", 199, "🎲", "Board Games", ["trending"], "Trade wood for sheep, lose friends, demand a rematch. The cycle of life.", un("1547638375-ebf04735d792")],
      ["Rubik's Speed Cube", 59, "🟥", "Puzzles", [], "Twelve moves from solved, forever. The desk fidget of champions.", un("1567646303972-f7de3a9c0a05")],
      ["Giant Teddy Bear", 249, "🧸", "Plush", ["bestseller"], "Four feet of unconditional, fictional emotional support.", un("1602734846297-9299fc2d4703")],
      ["RC Drift Racer 4WD", 349, "🏎️", "RC", ["hot"], "Grippy 4WD and a controller range that ends exactly one meter too soon.", un("1758964087156-0eac97044f84")],
      ["1000-Piece Jigsaw Puzzle", 79, "🧩", "Puzzles", [], "A weekend, a folding table, and one piece that's definitely missing.", un("1591040092219-081fb773589c")],
    ],
    outdoors: [
      ["4-Person Dome Tent", 599, "⛺", "Camping", ["bestseller"], "Sets up in minutes, survives the one storm you didn't plan for.", un("1631635589499-afd87d52bf64")],
      ["Osprey 65L Trek Backpack", 799, "🎒", "Hiking", ["hot"], "Straps for days and pockets you'll keep discovering on day three.", un("1622260614927-208cfe3f5cfd")],
      ["YETI Tundra Cooler", 899, "🧊", "Cooling", ["staff"], "Holds ice for a week and bears out for good measure.", un("1550720766-13563d26a25f")],
      ["Hydro Flask 32oz", 149, "🚰", "Water", ["bestseller"], "Ice-cold for 24 hours. The unofficial trophy of staying hydrated.", un("1586277419671-f34cf56500a0")],
      ["Coleman Camp Stove", 349, "🔥", "Camping", [], "Two burners between you and a very sad cold-sandwich dinner.", un("1529385232332-276282a2ce5c")],
      ["Portable Camp Hammock", 129, "🌴", "Hiking", ["new"], "Two trees and thirty seconds from the best decision of the whole trip.", un("1526471873993-f236a150a764")],
    ],
  };

  /* ── Build catalog with stable derived stats ────────────── */
  const PRODUCTS = [];
  const BY_ID = {};

  CATEGORIES.forEach((cat) => {
    (DEFS[cat.id] || []).forEach((d, i) => {
      const [name, price, emoji, sub, badges, blurb, img, hairTypes, options] = d;
      const id = `${cat.id}-${i + 1}`;
      const h = hash(id + name);
      const p = {
        id, cat: cat.id, name, price, emoji, sub,
        badges: badges || [],
        blurb,
        desc: `${blurb} ${cat.boiler}`,
        img: img || null,
        hairTypes: hairTypes || null,
        options: options || null,
        grad: cat.pal[i % cat.pal.length],
        rating: (40 + (h % 11)) / 10,                    // 4.0 – 5.0
        reviews: 60 + ((h >>> 3) % 7900),                // 60 – 7960
        mins: 10 + ((h >>> 5) % 36),                     // 10 – 45 min delivery
        pop: 55 + ((h >>> 7) % 45),                      // 55 – 99 popularity
        stock: 3 + ((h >>> 9) % 38),                     // 3 – 40 in stock
      };
      PRODUCTS.push(p);
      BY_ID[id] = p;
    });
  });

  const byId = (id) => BY_ID[id];
  const byCat = (catId) => PRODUCTS.filter((p) => p.cat === catId);
  const category = (catId) => CATEGORIES.find((c) => c.id === catId);

  const search = (q) => {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter((p) => {
      const c = category(p.cat);
      return (
        p.name.toLowerCase().includes(q) ||
        p.sub.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        p.blurb.toLowerCase().includes(q)
      );
    });
  };

  /* ── Cart keys + configurable options ───────────────────── */
  // A cart key is "productId" or "productId~256GB~13-inch" when the
  // product has selectable options.
  const splitKey = (key) => {
    const parts = String(key).split("~");
    return { id: parts[0], opts: parts.slice(1) };
  };

  const optionExtra = (p, opts) => {
    if (!p?.options || !opts || !opts.length) return 0;
    let extra = 0;
    Object.values(p.options).forEach((group) =>
      group.forEach(([label, delta]) => {
        if (delta && opts.includes(label)) extra += delta;
      }));
    return extra;
  };

  // Key with every option group at its base choice.
  const defaultKey = (p) =>
    p.options ? [p.id, ...Object.values(p.options).map((g) => g[0][0])].join("~") : p.id;

  /* ── Seasonal event (DopaFriday — every Friday) ─────────── */
  const eventInfo = () =>
    new Date().getDay() === 5
      ? { id: "dopafriday", name: "DopaFriday", emoji: "🎉", xpMult: 2, tagline: "Mega deals + 2× XP, Fridays only" }
      : null;

  /* ── Flash sale (rotates daily, deterministic) ──────────── */
  // On DopaFriday the sale doubles in size and cuts deeper.
  const flashSale = () => {
    const seed = daySeed();
    const ev = eventInfo();
    const picks = pickSeeded(PRODUCTS.filter((p) => p.price >= 50), ev ? 12 : 6, seed);
    const rand = seededRand(seed * 7 + 1);
    return picks.map((p) => ({
      ...p,
      discount: (ev ? 30 : 20) + Math.round(rand() * 6) * 5,   // 20–50 % (30–60 on DopaFriday)
    }));
  };

  // Day-cached flash lookup + effective pricing (used app-wide).
  let flashCache = null, flashDay = 0;
  const flashMap = () => {
    if (flashDay !== daySeed()) {
      flashDay = daySeed();
      flashCache = {};
      flashSale().forEach((p) => { flashCache[p.id] = p.discount; });
    }
    return flashCache;
  };

  const priceOf = (p) => {
    const off = flashMap()[p.id];
    if (!off) return { price: p.price, was: null, off: 0 };
    return { price: p.price * (1 - off / 100), was: p.price, off };
  };

  // Final unit price: flash-adjusted base + option deltas.
  const unitPrice = (p, opts) => priceOf(p).price + optionExtra(p, opts);

  const dailyPicks = () => pickSeeded(PRODUCTS, 8, daySeed() * 13 + 5);

  /* ── Bundles ("Frequently bought together") ─────────────── */
  // Two stable companions per product: one from its own category,
  // one from a sibling category — deterministic via the product id.
  const bundleFor = (p) => {
    const same = PRODUCTS.filter((x) => x.id !== p.id && x.cat === p.cat);
    const other = PRODUCTS.filter((x) => x.cat !== p.cat && !x.options);
    const a = pickSeeded(same, 1, hash(p.id + "bundle"))[0];
    const b = pickSeeded(other, 1, hash(p.id + "bundle2"))[0];
    return [a, b].filter(Boolean);
  };

  /* ── Coupons ────────────────────────────────────────────── */
  const COUPONS = {
    SAVE10: { pct: 10, label: "10% off" },
    DOPA20: { pct: 20, label: "20% off" },
    LUCKY25: { pct: 25, label: "25% off" },
    VIP30: { pct: 30, label: "30% off" },
    COMEBACK15: { pct: 15, label: "15% off — welcome back" },
    FREESHIP: { pct: 0, freeShip: true, label: "Free delivery" },
    // Tier-exclusive codes — the spin wheel hands these out (state.TIERS).
    ELITE35: { pct: 35, label: "35% off — Silver spin prize" },
    ROYAL40: { pct: 40, label: "40% off — Gold spin prize" },
    MYTHIC45: { pct: 45, label: "45% off — Platinum spin prize" },
    LEGEND50: { pct: 50, label: "50% off — Diamond spin prize" },
    OBSIDIAN55: { pct: 55, label: "55% off — Obsidian spin prize" },
    COSMIC60: { pct: 60, label: "60% off — Cosmic spin prize" },
    SINGULARITY66: { pct: 66, label: "66% off — Singularity spin prize" },
  };

  /* ── Drivers (for fake deliveries) ──────────────────────── */
  const DRIVERS = [
    { name: "Marco V.", ava: "🧑‍✈️", vehicle: "Red Scooter", plate: "DOPA-42" },
    { name: "Aisha K.", ava: "👩‍🚀", vehicle: "E-Bike", plate: "ZOOM-77" },
    { name: "Kenji T.", ava: "🧑‍🎤", vehicle: "Hatchback", plate: "SNCK-01" },
    { name: "Luna R.", ava: "🦸", vehicle: "Cargo Bike", plate: "FAST-99" },
    { name: "Diego M.", ava: "🤠", vehicle: "Pickup Truck", plate: "YEEH-88" },
    { name: "Priya S.", ava: "🥷", vehicle: "Motorcycle", plate: "NINJ-13" },
    { name: "Omar B.", ava: "🧙", vehicle: "Delivery Van", plate: "WIZR-07" },
  ];

  /* ── Fake reviews (deterministic per product) ───────────── */
  const REVIEWERS = [
    ["Maya", "🦊"], ["Jordan", "🐼"], ["Zack", "🦁"], ["Amara", "🐸"],
    ["Leo", "🐯"], ["Nina", "🦄"], ["Ravi", "🐨"], ["Sofia", "🐰"],
    ["Kai", "🐙"], ["Emma", "🦉"], ["Tariq", "🐺"], ["Chloe", "🐱"],
  ];
  const REVIEW_LINES = [
    "Exceeded every expectation I didn't know I had. Would rate 6 stars if the button existed.",
    "Arrived fictionally fast. My whole personality is built around this now.",
    "I don't usually write reviews but this changed the trajectory of my week.",
    "Bought one for me and one for my future self. No regrets on either.",
    "The hype is real. The delivery is not. Somehow still worth it.",
    "My friends keep asking about it. I keep gatekeeping. 10/10.",
    "Quality feels premium beyond the price. DopaCart cooked with this one.",
    "This is my third one. Not because they break — because I love them.",
    "Life before this item is a blur. Life after is in 4K.",
    "Honestly bought it for the dopamine. Delivered exactly that.",
    "The little details are what get you. Someone really thought this through.",
    "Instant favorite. My cart has never felt so seen.",
  ];

  const reviewsFor = (p) => {
    const h = hash(p.id);
    const out = [];
    for (let i = 0; i < 3; i++) {
      const rv = REVIEWERS[(h >>> (i * 4)) % REVIEWERS.length];
      out.push({
        name: rv[0], ava: rv[1],
        stars: 4 + ((h >>> (i * 3 + 2)) % 2),
        text: REVIEW_LINES[(h >>> (i * 5 + 1)) % REVIEW_LINES.length],
        ago: 1 + ((h >>> (i * 2 + 3)) % 28),
      });
    }
    return out;
  };

  /* ── Badge display config ───────────────────────────────── */
  const BADGES = {
    trending: { label: "Trending", cls: "hot" },
    bestseller: { label: "Best Seller", cls: "gold" },
    limited: { label: "Limited Drop", cls: "hot" },
    staff: { label: "Staff Pick", cls: "" },
    new: { label: "New", cls: "" },
    hot: { label: "Hot", cls: "hot" },
  };

  /* ── Changelog (settings screen) ────────────────────────── */
  const CHANGELOG = [
    { v: "1.8.0", notes: ["3 new categories — 🐾 Pets, 🧸 Toys & Games, 🏕️ Outdoors — 18 new products, all in the Collection", "Levels no longer stop at The Final Boss of Shopping — 10 new titles up to The Shopping Singularity, then prestige stars (★) forever", "3 new VIP tiers above Diamond: ⬛ Obsidian, 🌌 Cosmic, 🕳️ Singularity (up to 30% cashback, ×3 spin payouts, 66% spin coupon)", "8 new badges including Whale, Tycoon, Hoarder and Gotta Buy 'Em All", "Bigger orders now take the courier longer to deliver — a full cart can take up to 15 minutes"] },
    { v: "1.7.4", notes: ["Faster spins — the wheel now settles in 2.6s instead of 4.2s", "⚡ Spin all — burn every spin at once and get one combined haul summary (bonus spins you win stay for the next round)", "Buy max — top up as many spins as your coins allow in a single tap", "App now stays in portrait; turned sideways on a phone, it politely asks you to rotate back"] },
    { v: "1.7.3", notes: ["DopaBot's bubble is now draggable — grab him, drop him anywhere, and he spring-snaps to the nearest edge with a satisfying pop", "He remembers where you put him (even after closing the app) and stops auto-wandering once you've placed him", "Grows under your finger while dragging, stays clear of the tab bar, and survives screen rotation"] },
    { v: "1.7.2", notes: ["Fixed: DopaBot now knows your real balance, coins, spins, level, VIP tier, streak and orders — answered straight from your save, always accurate", "These answers now work identically on every browser, so iPhone/Safari home-screen users get the same smart assistant (the extra on-device AI boost is Chrome-only, but DopaBrain runs everywhere)", "DopaBot can also open Rewards, Collection or your live order from chat"] },
    { v: "1.7.1", notes: ["Real photos for the 11 products that were emoji-only: SteelSeries mousepad, Anker charger, Fitbit Charge 6, Chemex, Baseus car vacuum, Little Trees, iOttie mount, WeatherTech liners, Michelin inflator, Turtle Wax, Amazon Basics organizer", "Fixed the Govee LED Strip 5m photo — now actually shows LED strip lighting", "Every product in the catalog now has an image"] },
    { v: "1.7.0", notes: ["DopaBot is now a real conversation — type anything: \"gaming under 500\", \"curly hair routine\", \"where's my order\", \"surprise me\"…", "Uses Chrome's built-in on-device AI (Gemini Nano) when your browser has it; otherwise the new DopaBrain™ intent engine — either way, everything stays on your device", "Product picks always come from the real catalog, never made up", "DopaBot now floats around the app as an animated bubble — drifts, bobs, emotes, and occasionally whispers about deals. Tap him to chat"] },
    { v: "1.6.3", notes: ["Spin payouts now scale with your VIP tier — ×1.25 Silver up to ×2 Diamond on cash, coins and XP (jackpot hits SAR 10,000 at Diamond)", "Tier-exclusive spin coupons: 30% Bronze → 35% Silver → 40% Gold → 45% Platinum → 50% Diamond", "Fixed daily streak: a broken streak now resets to 0 right away (with a heads-up) instead of showing a stale count that silently collapsed on your next claim"] },
    { v: "1.6.2", notes: ["Service worker now revalidates with the server on every fetch — the browser's HTTP cache can never serve stale app files again (fixes stuck old versions on hosts like GitHub Pages)", "New in Settings: Check for Updates — fetches the latest version on demand"] },
    { v: "1.6.1", notes: ["Lucky Spin pays way better: SAR 800 base cash, SAR 5,000 jackpot, up to 150 coins, 250 XP, +2 spins, a 30% coupon — and a new segment that instantly recharges your Mystery Box", "Fixed: skipping a spin and tapping outside the reward dialog left the button stuck on \"Spinning…\"", "Reward dialogs now refresh the screen however you close them"] },
    { v: "1.6.0", notes: ["Daily Quests — 3 rotating goals a day, auto-paying coins & XP (+ bonus spin for the sweep)", "VIP tiers Bronze → Diamond — lifetime spending boosts your cashback up to 20%", "Write your own product reviews (first review per product pays 30 coins)", "Unbox delivered orders for surprise coins & XP", "Frequently Bought Together bundles on every product", "Your Wrapped — a stats page of your fictional shopping year", "Collection gallery — every product you've ever owned, Pokédex style", "DopaBot personal shopper — chat your way to curated picks", "Gift a cart — share a code, import a cart", "DopaFriday — bigger flash sales + 2× XP every Friday", "Price-drop alerts for favorites & cart reminders (code COMEBACK15)"] },
    { v: "1.5.0", notes: ["Color options for Apple products — real colorways per model", "Support section in Settings: Returns & Refunds (full DopaCash back on delivered orders)", "File a Complaint — fictional tickets, real coin compensation (once daily)"] },
    { v: "1.4.1", notes: ["Fixed monitor photo mismatch — now Alienware 27 (matching its picture)", "Added Apple Studio Display with its official image"] },
    { v: "1.4.0", notes: ["New Apple category — iPhone 17 lineup, iPads, Macs, Watch, Vision Pro & more with official images from apple.com", "Choose storage and size options on Apple products", "Buy spins any time (stack as many as you like) + skip the spin animation", "Fixed product photos to match what products actually are", "Removed the Beauty category"] },
    { v: "1.3.0", notes: ["Fixed stale caching — updates now load automatically", "Network-first: fresh files whenever online, cache only as offline fallback", "App auto-reloads once when a new version arrives (with a toast)"] },
    { v: "1.2.1", notes: ["New app icon: cart + lightning bolt (replaces the plain \"D\")"] },
    { v: "1.2.0", notes: ["Sound effects: spin ratchet, checkout fanfare, reward chimes & shimmers", "Each reward type has its own distinct sound", "Sound toggle in Settings"] },
    { v: "1.1.0", notes: ["Prices now in Saudi Riyals (SAR) with 15% VAT", "Real product photos across the catalog", "Real brand names — incl. Saudi favorites in Food & Drinks", "Hair Care is now the full BASED Bodyworks lineup (based.com)", "Economy rebalanced for SAR"] },
    { v: "1.0.0", notes: ["Initial release", "10 categories, 100+ fictional products", "Live order tracking with fake map", "Rewards: XP, coins, streaks, spins, mystery boxes", "5 unlockable themes", "Full offline support (PWA)"] },
  ];

  const HAIR_TYPES = ["straight", "wavy", "curly", "coily", "fine", "thick", "dry", "oily", "damaged", "frizzy"];

  return {
    VERSION, CATEGORIES, PRODUCTS, COUPONS, DRIVERS, BADGES, CHANGELOG, HAIR_TYPES,
    byId, byCat, category, search, flashSale, dailyPicks, reviewsFor,
    splitKey, optionExtra, defaultKey, priceOf, unitPrice,
    eventInfo, bundleFor,
  };
})();
