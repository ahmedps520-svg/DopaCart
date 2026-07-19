/* ═══════════════════════════════════════════════════════════════
   DopaCart — data.js
   The marketplace catalog: categories, products, coupons,
   drivers, review generators. Prices are in Saudi Riyals (SAR).
   Product names reference real brands for flavor; nothing is
   actually sold and no order is real. Product photos are
   hotlinked from their sources (see Credits in Settings).
   ═══════════════════════════════════════════════════════════════ */

DC.data = (() => {
  const { hash, seededRand, daySeed, pickSeeded } = DC.util;

  const VERSION = "1.1.0";

  /* Image URL helpers */
  const un = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;
  const wm = (path) => `https://upload.wikimedia.org/wikipedia/commons/${path}`;
  const based = (file) => `https://cdn.shopify.com/s/files/1/0666/0125/5141/files/${file}`;

  /* ── Categories ─────────────────────────────────────────── */
  // grad: banner gradient · pal: fallback card gradients (cycled)
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
      id: "beauty", name: "Beauty", emoji: "🧴", tagline: "Glow different",
      grad: ["#33101f", "#e0568f"],
      pal: [["#33101f", "#d15488"], ["#101f33", "#4a86d1"], ["#2c2410", "#c9a53a"], ["#0f2e2a", "#35ad96"]],
      subs: ["Skincare", "Fragrance", "Care"],
      boiler: "The shelf-care icons your explore page keeps recommending. Gentle on all imaginary skin types.",
    },
    {
      id: "office", name: "School & Office", emoji: "📚", tagline: "Organized chaos, organized",
      grad: ["#141b3d", "#5866e0"],
      pal: [["#141b3d", "#5460d1"], ["#0f2e33", "#2ba3ad"], ["#2e1a10", "#c06a35"], ["#25102e", "#9a4ac0"]],
      subs: ["Paper", "Tools", "Carry", "Desk"],
      boiler: "Productivity not included but strongly implied. Pairs well with pretending to take notes.",
    },
  ];

  /* ── Products ───────────────────────────────────────────── */
  // [name, price(SAR), emoji, sub, badges[], blurb, img, hairTypes?]
  const DEFS = {
    gaming: [
      ["Sony DualSense Wireless Controller", 279, "🎮", "PlayStation", ["bestseller", "hot"], "Haptics so real you'll feel the rain in the game. Adaptive triggers, zero excuses.", un("1606813907291-d86efa9b94db")],
      ["Razer BlackWidow V4 Pro", 899, "⌨️", "PC Gaming", ["trending"], "Clicky greens, dedicated macro keys, and enough RGB to be seen from orbit.", un("1587829741301-dc798b83add3")],
      ["Logitech G Pro X Superlight 2", 549, "🖱️", "PC Gaming", ["bestseller"], "60 grams of pure aim. If you still miss, that one's on you.", un("1527814050087-3793815479db")],
      ["SteelSeries QcK Heavy XXL", 149, "🌌", "Accessories", ["new"], "A desk-sized runway for your mouse. Stitched edges, zero drag, infinite vibes.", un("1547394765-185e1e68f34e")],
      ["Samsung Odyssey G7 32\"", 2499, "📺", "PC Gaming", ["staff"], "1000R curve and 240Hz. You'll blame lag on yourself for once.", un("1527443224154-c4a3942d3acf")],
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
      ["BASED Curl Gel", 77, "💠", "Curls", [], "Hold that lasts the whole day, plus the humidity has been formally dismissed.", based("CG-01.png"), ["curly", "coily", "thick"]],
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
      ["Casio G-Shock GA-2100", 399, "⌚", "Accessories", ["staff"], "Survives drops, dives, and deadlines. The CasiOak your wrist deserves.", un("1523170335258-f5ed11844a49")],
      ["Ray-Ban Original Wayfarer", 649, "🕶️", "Accessories", ["trending"], "Worn by icons since 1956. Makes every parking lot look like a movie scene.", un("1572635196237-14b3f281503f")],
      ["Gucci GG Marmont Crossbody", 8999, "👜", "Accessories", ["limited"], "Quilted leather, gold hardware, and the confidence of someone who doesn't check price tags.", un("1548036328-c9fa89d128fa")],
      ["New Era 59FIFTY Cap", 179, "🧢", "Accessories", ["new"], "Structured crown, flat brim, instant credibility.", un("1521369909029-2afed882baee")],
      ["Cuban Link Chain 18K", 449, "📿", "Accessories", [], "Gold-toned links with main-character shine. Fictionally hypoallergenic.", un("1599643478518-a784e5dc4c8f")],
      ["Birkenstock Arizona", 449, "🩴", "Shoes", ["hot"], "Cork soles that mold to your feet. Comfort so real it transcends the fiction.", un("1603487742131-4160ec999306")],
    ],
    tech: [
      ["iPhone 16 Pro", 4899, "📱", "Mobile", ["hot", "bestseller"], "Titanium, a camera bump you could rappel from, and a screen smoother than your excuses.", un("1510557880182-3d4d3cba35a5")],
      ["Samsung Galaxy Tab S9", 2999, "📲", "Mobile", [], "Laptop power, couch energy. The S Pen attaches magnetically and vanishes mysteriously.", un("1544244015-0df4b3ffc6b0")],
      ["Apple Watch Ultra 2", 3399, "⏱️", "Mobile", ["trending"], "Tracks heart rate, sleep, and how often you check it to avoid conversation.", wm("4/4b/Apple_Watch_Ultra_Series_3_Natural_Titanium_Case.jpg")],
      ["Anker Nano II 65W", 149, "⚡", "Power", ["new"], "Charges your laptop, phone, and buds at once. Smaller than a plum.", un("1588508065123-287b28e013da")],
      ["Anker PowerCore 20K", 199, "🔋", "Power", ["bestseller"], "Twenty thousand milliamps between you and 1% panic.", un("1609091839311-d5365f9ff1c5")],
      ["JBL Charge 5", 649, "🔊", "Audio", [], "Room-filling sound in every direction. Neighbors become fans, involuntarily.", un("1608043152269-423dbba4e7e1")],
      ["Apple AirPods Pro 2", 949, "🎵", "Audio", ["trending"], "Noise cancellation strong enough to mute an entire open office.", wm("b/b9/AirPods_Pro_3_with_case.jpg")],
      ["Sony α7 IV", 9999, "📷", "Cameras", ["staff"], "Full-frame magic. Your food pics are about to get a gallery show.", un("1516035069371-29a1b244cc32")],
      ["Philips Hue Starter Kit", 799, "💡", "Smart Home", [], "Sixteen million colors, voice controlled. 'Movie mode' will change your life.", un("1565814329452-e1efa11c5b89")],
      ["Apple AirTag (4-Pack)", 449, "📍", "Smart Home", [], "Attach to keys, wallet, remote, and your sense of direction.", un("1622434641406-a158123450f9")],
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
      ["Fitbit Charge 6", 649, "📈", "Gear", ["new"], "Counts steps, reps, and streaks. Judges you silently but supportively.", un("1508685096489-7aacd43bd3b1")],
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
      ["Govee LED Strip 5m", 129, "💫", "Lighting", ["bestseller"], "Music-sync mode turns your ceiling into the aurora borealis, localized entirely in your room.", un("1519608487953-e999c86e7455")],
      ["Xiaomi Mi Desk Lamp Pro", 149, "🪔", "Lighting", [], "Infinite dimming and an arc that looks like modern art.", un("1507473885765-e6ed057f782c")],
      ["Monstera Deliciosa Plant", 89, "🪴", "Decor", ["staff"], "Thrives on neglect and compliments. Big-leaf energy included.", un("1614594975525-e45190c55d0b")],
      ["Fatboy Original Bean Bag", 699, "🛋️", "Decor", ["bestseller"], "Memory foam the size of a small moon. Getting out is a tomorrow problem.", un("1567016432779-094069958ea5")],
      ["Neon Wall Art Sign", 299, "🖼️", "Decor", [], "LED glow that makes any wall the main character.", un("1563089145-599997674d42")],
      ["IKEA KALLAX Shelf Unit", 399, "🗄️", "Storage", [], "Eight cubes that turn chaos into 'aesthetic minimalism'.", un("1594620302200-9a762244a156")],
      ["Philips Airfryer XXL", 899, "🍳", "Kitchen", ["trending"], "Crispy everything, zero guilt, one appliance now responsible for 80% of your meals.", un("1556909114-f6e7ad7d3136")],
      ["Chemex Pour-Over Set", 349, "🫖", "Kitchen", [], "Glass-hourglass coffee and the moral high ground over pod machines.", un("1544787219-7f47ccb76574")],
      ["Vitruvi Stone Diffuser", 249, "🕯️", "Decor", [], "Ultrasonic mist plus 'Rainy Bookstore' oil. Your room, but cinematic.", un("1608571423902-eed4a5ad8108")],
      ["Braun Classic Alarm Clock", 199, "🕰️", "Decor", ["limited"], "Dieter Rams design. Waking up is still bad, but it looks incredible.", un("1563861826100-9cb868fdbe1c")],
    ],
    auto: [
      ["Meguiar's Complete Detail Kit", 249, "🧽", "Care", [], "Foam cannon, microfiber army, and a shine that resets your car to showroom.", un("1520340356584-f9917d1eea6f")],
      ["Baseus A2 Pro Car Vacuum", 179, "🌪️", "Gadgets", [], "Cordless cyclone that finds fries from road trips you don't remember taking.", null],
      ["Little Trees Black Ice 3-Pack", 25, "🌲", "Interior", ["new"], "Smells like a forest that also went to design school.", un("1441974231531-c6227db76b6e")],
      ["iOttie MagSafe Car Mount", 129, "🧲", "Gadgets", ["bestseller"], "Snaps on one-handed at a red light. Holds through potholes and questionable playlists.", un("1512428559087-560fa5ceab42")],
      ["70mai A800S Dash Cam", 449, "📹", "Gadgets", ["staff"], "4K front and rear witness. Night vision sharp enough to read regret.", un("1449965408869-eaa3f722e40d")],
      ["WeatherTech FloorLiner Set", 599, "🛞", "Interior", [], "Laser-measured fit. Contains spills, mud, and juice box incidents.", un("1503376780353-7e6692767b70")],
      ["Michelin Digital Tire Inflator", 199, "🎈", "Gadgets", [], "Auto-stops at target PSI. The low-pressure light fears you now.", un("1568605117036-5fe5e7bab0b7")],
      ["Govee Car Underglow Kit", 229, "🚗", "Interior", ["limited"], "App-controlled glow. Technically street-legal in the fictional universe.", un("1544636331-e26879cd4d9b")],
      ["Turtle Wax Ceramic Spray", 89, "✨", "Care", [], "Water beads so hard it looks like CGI. Lasts six imaginary months.", null],
      ["Amazon Basics Trunk Organizer", 99, "🕸️", "Interior", [], "Groceries stay upright. The rogue orange era is over.", null],
    ],
    beauty: [
      ["CeraVe Foaming Cleanser", 89, "🧼", "Skincare", ["bestseller"], "Removes sunscreen, city, and the general concept of Monday.", un("1556228578-8c89e6adf883")],
      ["The Ordinary Niacinamide 10%", 65, "💎", "Skincare", ["trending"], "The serum with a cult following and a chemistry-exam name.", un("1620916566398-39f1143ab7be")],
      ["La Roche-Posay Anthelios SPF50+", 119, "☀️", "Skincare", ["staff"], "No white cast, no grease, no excuse. Future you says thanks.", un("1526947425960-945c6e72858f")],
      ["Cetaphil Moisturising Cream", 79, "🌥️", "Skincare", [], "Whipped, weightless, and gone in three seconds. Dry patches never happened.", un("1556228720-195a672e8a03")],
      ["Burt's Bees Lip Balm Trio", 45, "🍯", "Care", ["new"], "Beeswax, honey, and pomegranate. You will lose two. That's why it's a trio.", un("1586495777744-4413f21062fa")],
      ["Chanel N°5 EDP 100ml", 699, "🌑", "Fragrance", ["limited"], "A century of icon status in one bottle. Compliments fictionally guaranteed.", un("1541643600914-78b084683601")],
      ["Rituals Samurai Body Wash", 69, "🛁", "Care", [], "A ten-minute shower becomes a forty-minute lore-building session.", un("1583947581924-860bda6a26df")],
      ["Crest 3D Whitestrips", 189, "🦷", "Care", [], "Your smile, remastered in HD.", un("1606811841689-23dfddce3e95")],
      ["Rose Quartz Face Roller", 79, "🌹", "Skincare", ["trending"], "Cold stone, warm reviews. De-puffs mornings and existential dread.", un("1596462502278-27bfdc403348")],
      ["Evian Facial Spray", 55, "🌫️", "Skincare", [], "A three-second reset button for your face. Drama free.", un("1600428877878-1a0fd85beda8")],
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
  };

  /* ── Build catalog with stable derived stats ────────────── */
  const PRODUCTS = [];
  const BY_ID = {};

  CATEGORIES.forEach((cat) => {
    (DEFS[cat.id] || []).forEach((d, i) => {
      const [name, price, emoji, sub, badges, blurb, img, hairTypes] = d;
      const id = `${cat.id}-${i + 1}`;
      const h = hash(id + name);
      const p = {
        id, cat: cat.id, name, price, emoji, sub,
        badges: badges || [],
        blurb,
        desc: `${blurb} ${cat.boiler}`,
        img: img || null,
        hairTypes: hairTypes || null,
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

  /* ── Flash sale (rotates daily, deterministic) ──────────── */
  const flashSale = () => {
    const seed = daySeed();
    const picks = pickSeeded(PRODUCTS.filter((p) => p.price >= 50), 6, seed);
    const rand = seededRand(seed * 7 + 1);
    return picks.map((p) => ({
      ...p,
      discount: 20 + Math.round(rand() * 6) * 5,         // 20–50 %
    }));
  };

  const dailyPicks = () => pickSeeded(PRODUCTS, 8, daySeed() * 13 + 5);

  /* ── Coupons ────────────────────────────────────────────── */
  const COUPONS = {
    SAVE10: { pct: 10, label: "10% off" },
    DOPA20: { pct: 20, label: "20% off" },
    LUCKY25: { pct: 25, label: "25% off" },
    VIP30: { pct: 30, label: "30% off" },
    FREESHIP: { pct: 0, freeShip: true, label: "Free delivery" },
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
    { v: "1.1.0", notes: ["Prices now in Saudi Riyals (SAR) with 15% VAT", "Real product photos across the catalog", "Real brand names — incl. Saudi favorites in Food & Drinks", "Hair Care is now the full BASED Bodyworks lineup (based.com)", "Economy rebalanced for SAR"] },
    { v: "1.0.0", notes: ["Initial release", "10 categories, 100+ fictional products", "Live order tracking with fake map", "Rewards: XP, coins, streaks, spins, mystery boxes", "5 unlockable themes", "Full offline support (PWA)"] },
  ];

  const HAIR_TYPES = ["straight", "wavy", "curly", "coily", "fine", "thick", "dry", "oily", "damaged", "frizzy"];

  return {
    VERSION, CATEGORIES, PRODUCTS, COUPONS, DRIVERS, BADGES, CHANGELOG, HAIR_TYPES,
    byId, byCat, category, search, flashSale, dailyPicks, reviewsFor,
  };
})();
