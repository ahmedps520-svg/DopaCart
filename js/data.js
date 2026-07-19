/* ═══════════════════════════════════════════════════════════════
   DopaCart — data.js
   The entire fictional marketplace: categories, products,
   coupons, drivers, review generators. Nothing here is real.
   ═══════════════════════════════════════════════════════════════ */

DC.data = (() => {
  const { hash, seededRand, daySeed, pickSeeded } = DC.util;

  const VERSION = "1.0.0";

  /* ── Categories ─────────────────────────────────────────── */
  // grad: banner gradient · pal: product-image gradients (cycled)
  const CATEGORIES = [
    {
      id: "gaming", name: "Gaming", emoji: "🎮", tagline: "Level up your setup",
      grad: ["#2b0a3d", "#c81d5e"],
      pal: [["#31104f", "#7a2ce0"], ["#0e2a52", "#2f6bff"], ["#3d0f24", "#e0356b"], ["#101c3a", "#5e5ce6"]],
      subs: ["PC Gaming", "PlayStation", "Xbox", "Nintendo", "Sim Racing", "VR", "Streaming", "Accessories"],
      boiler: "Engineered for the obsessed. Tuned, tested, and tournament-approved by people who definitely should go outside more.",
    },
    {
      id: "hair", name: "Hair Care", emoji: "💇", tagline: "Your best hair day, daily",
      grad: ["#0b3a3a", "#2bb8a3"],
      pal: [["#0d3b36", "#27b0a0"], ["#123a5c", "#38a3e0"], ["#31255c", "#8f6fe8"], ["#3a2a10", "#d4a24e"]],
      subs: ["Styling", "Wash", "Treatment", "Tools"],
      boiler: "Formulated in our imaginary lab with ingredients we made up but would absolutely trust.",
    },
    {
      id: "fashion", name: "Fashion", emoji: "👕", tagline: "Drip, delivered",
      grad: ["#3a0f2e", "#e05297"],
      pal: [["#3a0f2e", "#d6488b"], ["#101c3a", "#4a6cf7"], ["#2e2010", "#c99a3f"], ["#132e22", "#39b678"]],
      subs: ["Clothing", "Shoes", "Accessories"],
      boiler: "Cut, stitched, and styled in a dimension where everything fits perfectly on the first try.",
    },
    {
      id: "tech", name: "Technology", emoji: "📱", tagline: "Tomorrow's gadgets, today-ish",
      grad: ["#0a1f3d", "#1f8fff"],
      pal: [["#0c2242", "#2f80ed"], ["#161a3a", "#7a5cff"], ["#0d3336", "#22b8c9"], ["#26102e", "#a44ae0"]],
      subs: ["Mobile", "Audio", "Power", "Smart Home", "Cameras"],
      boiler: "Packed with specs that sound incredible because we invented them. Ships with a cable you'll lose immediately.",
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
      boiler: "Prepared in a ghost kitchen so ghostly it does not exist. Zero calories, because it's fictional.",
    },
    {
      id: "home", name: "Home", emoji: "🏠", tagline: "Make your space glow",
      grad: ["#2e1d0a", "#e0a53a"],
      pal: [["#2e1f0c", "#cf9a35"], ["#12283a", "#3d8fc9"], ["#152e18", "#48a85e"], ["#2b1230", "#a052c9"]],
      subs: ["Lighting", "Decor", "Kitchen", "Storage"],
      boiler: "Interior-designer approved (the designer is also fictional). Some assembly imaginarily required.",
    },
    {
      id: "auto", name: "Automotive", emoji: "🚗", tagline: "Treat your ride",
      grad: ["#161d26", "#5b7fa6"],
      pal: [["#151c26", "#4f759e"], ["#26100e", "#c94f38"], ["#101f30", "#2e7fc0"], ["#1e2410", "#8fa62b"]],
      subs: ["Care", "Gadgets", "Interior"],
      boiler: "Fits every make and model ever produced, because none of this exists. Garage-tested in theory.",
    },
    {
      id: "beauty", name: "Beauty", emoji: "🧴", tagline: "Glow different",
      grad: ["#33101f", "#e0568f"],
      pal: [["#33101f", "#d15488"], ["#101f33", "#4a86d1"], ["#2c2410", "#c9a53a"], ["#0f2e2a", "#35ad96"]],
      subs: ["Skincare", "Fragrance", "Care"],
      boiler: "Dermatologist-adjacent. Cruelty-free, reality-free, and gentle on all imaginary skin types.",
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
  // [name, price, emoji, sub, badges[], blurb, hairTypes?]
  const DEFS = {
    gaming: [
      ["Vortex X9 Ultra Gaming PC", 2999, "🖥️", "PC Gaming", ["bestseller", "hot"], "Liquid-cooled beast with 240 fps to spare and a glass panel that glows like a reactor core."],
      ["PhantomStrike Mech Keyboard", 149, "⌨️", "PC Gaming", ["trending"], "Hot-swappable switches, gasket mount, and a thock so deep your neighbors will feel it."],
      ["HyperGlide Pro Wireless Mouse", 89, "🖱️", "PC Gaming", ["bestseller"], "58 grams of pure aim. 8K polling rate, zero excuses left."],
      ["NebulaPad XXL Desk Mat", 39, "🌌", "Accessories", ["new"], "A whole galaxy for your desk. Stitched edges, zero drag, infinite vibes."],
      ["Quantum 32\" 240Hz Monitor", 649, "📺", "PC Gaming", ["staff"], "1ms panel so smooth you'll blame lag on yourself for once."],
      ["GripKing Elite Controller", 179, "🎮", "PlayStation", ["trending"], "Back paddles, trigger stops, and grip texture rated for rage-quit resistance."],
      ["Apex GT Racing Wheel Bundle", 449, "🏎️", "Sim Racing", ["limited"], "Force feedback strong enough to make you apologize to the curb you clipped."],
      ["VoidVision VR Headset", 549, "🥽", "VR", ["new", "hot"], "4K per eye. Your living room will never feel big enough again."],
      ["ThroneX Ergo Gaming Chair", 389, "💺", "Accessories", ["bestseller"], "Lumbar support engineered for 9-hour sessions you said would be 'one quick game'."],
      ["EchoStorm 7.1 Headset", 129, "🎧", "Streaming", ["trending"], "Hear footsteps before they happen. Mic so clean your team has no excuse to mute you."],
      ["PrismFlow RGB Light Bars", 59, "🌈", "Accessories", ["new"], "Sixteen million colors. You will use exactly one: red."],
      ["CreatorDeck Stream Console", 199, "🎛️", "Streaming", ["staff"], "Fifteen macro keys between you and looking extremely professional on stream."],
      ["RetroPocket Handheld", 99, "🕹️", "Nintendo", ["limited"], "Ten thousand childhood memories in your pocket. Batteries fictionally included."],
    ],
    hair: [
      ["TideBreak Sea Salt Spray", 24, "🌊", "Styling", ["bestseller"], "Beach hair without the beach, the sand, or the seagull incident.", ["straight", "wavy", "fine"]],
      ["CloudCurl Defining Cream", 28, "☁️", "Styling", ["trending"], "Frizz surrenders. Curls clump, bounce, and behave like they signed a contract.", ["curly", "coily", "dry", "frizzy"]],
      ["MatteForge Styling Clay", 22, "🪨", "Styling", [], "All-day hold with zero shine. Your hair, but with opinions.", ["straight", "wavy", "thick", "oily"]],
      ["SilkRoot Argan Hair Oil", 32, "💧", "Treatment", ["staff"], "Five drops of liquid silk. Split ends file for retirement.", ["dry", "damaged", "frizzy", "curly"]],
      ["VelvetWave Texture Spray", 26, "🌀", "Styling", [], "Instant 'I woke up like this' for people who absolutely did not.", ["wavy", "fine", "straight"]],
      ["Midnight Pomade No. 9", 21, "🎩", "Styling", [], "Slick, structured, vaguely mysterious. Comes with imaginary jazz.", ["straight", "thick"]],
      ["FeatherLift Hair Powder", 19, "🪶", "Styling", ["new"], "Volume physics said was impossible. Gravity has been notified.", ["fine", "oily", "straight"]],
      ["HydraMask Deep Repair", 34, "🧖", "Treatment", ["bestseller"], "Ten minutes in, your hair forgets every bad decision you've made since 2019.", ["damaged", "dry", "coily", "curly"]],
      ["StormDry Ionic Dryer", 129, "💨", "Tools", ["hot"], "Salon airflow, whisper quiet. Dries hair faster than you can find your other sock.", ["thick", "curly", "straight", "wavy"]],
      ["CurlPop Universal Diffuser", 39, "🌸", "Tools", [], "Clips onto any dryer and treats your curls like royalty.", ["curly", "coily", "wavy"]],
      ["GhostHold Finishing Wax", 23, "👻", "Styling", [], "Hold you can't see. Restyle it forty times a day, we won't judge.", ["thick", "straight", "wavy"]],
      ["PureCycle Wash Duo", 29, "🫧", "Wash", ["trending"], "Sulfate-free shampoo + conditioner that resets your scalp to factory settings.", ["oily", "fine", "damaged", "dry"]],
    ],
    fashion: [
      ["Eclipse Oversized Hoodie", 79, "🥷", "Clothing", ["bestseller"], "Heavyweight fleece, blacked out completely. Pockets deep enough for your secrets."],
      ["AeroStride Retro Sneakers", 139, "👟", "Shoes", ["trending"], "Vintage silhouette, cloud sole. Yes, people will ask where you got them."],
      ["Ghost Graphic Tee", 35, "👕", "Clothing", [], "280gsm cotton with a print so subtle only the right people notice."],
      ["Nightfall Bomber Jacket", 149, "🧥", "Clothing", ["limited"], "Matte black bomber with a lining that feels like a handshake from the future."],
      ["FlexTaper Cargo Pants", 89, "👖", "Clothing", [], "Eight pockets. You need three. You will fill all eight."],
      ["Meridian Chrono Watch", 249, "⌚", "Accessories", ["staff"], "Sapphire glass, steel mesh, and the quiet confidence of someone always on time."],
      ["Halo Polarized Sunglasses", 89, "🕶️", "Accessories", ["trending"], "UV400 lenses that make every parking lot look like a movie scene."],
      ["Metro Crossbody Bag", 69, "👜", "Accessories", [], "Fits phone, wallet, keys, and the emotional baggage of your group chat."],
      ["Snapback OG Cap", 32, "🧢", "Accessories", ["new"], "Structured crown, flat brim, instant credibility."],
      ["Aurum Chain Necklace", 59, "📿", "Accessories", [], "18k gold-toned links. Fictionally hypoallergenic, actually iconic."],
      ["CloudStep Slides", 45, "🩴", "Shoes", ["hot"], "Walking on marshmallows, scientifically speaking."],
    ],
    tech: [
      ["Nova X Pro Smartphone", 1099, "📱", "Mobile", ["hot", "bestseller"], "A camera bump you could rappel from and a screen smoother than your excuses."],
      ["SlateTab 11", 649, "📲", "Mobile", [], "Laptop power, couch energy. The pencil attaches magnetically and disappears mysteriously."],
      ["PulseWatch Ultra", 449, "⏱️", "Mobile", ["trending"], "Tracks heart rate, sleep, and how many times you checked it to avoid conversation."],
      ["VoltDash 140W GaN Charger", 59, "⚡", "Power", ["new"], "Charges your laptop, phone, and buds at once. Smaller than a plum."],
      ["PowerBrick 20K", 49, "🔋", "Power", ["bestseller"], "Twenty thousand imaginary milliamps between you and 1% panic."],
      ["BoomOrb 360 Speaker", 129, "🔊", "Audio", [], "Room-filling sound in every direction. Neighbors become fans, involuntarily."],
      ["EchoBuds Pro ANC", 179, "🎵", "Audio", ["trending"], "Noise cancellation strong enough to mute an entire open office."],
      ["LensCraft M1 Camera", 1299, "📷", "Cameras", ["staff"], "Full-frame fictional sensor. Your food pics are about to get a gallery show."],
      ["GlowNest Smart Bulb Kit", 79, "💡", "Smart Home", [], "Sixteen million colors, voice controlled. 'Movie mode' will change your life."],
      ["FindAll Tracker Tiles (4pk)", 89, "📍", "Smart Home", [], "Attach to keys, wallet, remote, and your sense of direction."],
      ["Portal Mini Drone", 299, "🛸", "Cameras", ["limited"], "4K aerial shots and a return-home button for when you panic. You will panic."],
    ],
    fitness: [
      ["TitanShake Pro Shaker", 24, "🥤", "Gear", [], "Leak-proof, whisk ball included, survives being thrown in gym bags and moods."],
      ["IronGrip Adjustable Dumbbells", 299, "🏋️", "Equipment", ["bestseller"], "5 to 50 lbs with one click. An entire rack living under your bed."],
      ["FlexLoop Resistance Bands", 29, "🪢", "Equipment", [], "Five tension levels from 'warm-up' to 'why did I buy these'."],
      ["BeastMode Gym Duffel", 59, "🧳", "Gear", [], "Ventilated shoe pocket, wet pouch, and room for gear you'll definitely use."],
      ["HydroTank 1-Gallon", 34, "🚰", "Gear", ["trending"], "Time markers guilt-trip you into hydration, hour by hour."],
      ["VelocityRun Racers", 149, "🏃", "Gear", ["hot"], "Carbon-plated fictional foam. PRs voluntary but statistically likely."],
      ["ZenFold Exercise Mat", 45, "🧘", "Recovery", ["trending"], "Extra thick, zero slip. Ideal for yoga, stretching, and lying down dramatically."],
      ["RollOut Recovery Roller", 32, "🪵", "Recovery", [], "Hurts so good. Your IT band will write you a thank-you note eventually."],
      ["PulseBand Tracker", 99, "📈", "Gear", ["new"], "Counts steps, reps, and streaks. Judges you silently but supportively."],
      ["GripPro Lifting Kit", 27, "🧤", "Equipment", [], "Chalk, straps, and wrist wraps. Calluses sold separately."],
    ],
    food: [
      ["Inferno Pepperoni Pizza", 18, "🍕", "Meals", ["bestseller", "hot"], "Wood-fired, triple pepperoni, edges like stained glass. Ships at exactly 68° of perfect."],
      ["Double Stack Smash Burger", 14, "🍔", "Meals", ["trending"], "Two crispy-edged patties, secret sauce, and a bun with structural integrity."],
      ["Crispy Karaage Bucket", 16, "🍗", "Meals", [], "Japanese fried chicken so crunchy the mic picks it up from another room."],
      ["Molten Lava Cake", 9, "🍫", "Desserts", ["staff"], "The center flows like it has somewhere important to be. Ice cream included, obviously."],
      ["Cloud Nine Latte", 6, "☕", "Drinks", [], "Triple-shot with oat milk foam art of a cloud. Tastes like a productive morning."],
      ["Taro Dream Bubble Tea", 7, "🧋", "Drinks", ["trending"], "Purple, creamy, 50% boba by volume. The straw is basically a slide."],
      ["Galaxy Swirl Gelato", 8, "🍨", "Desserts", [], "Blackberry, vanilla bean, and edible glitter. Legally a mood improver."],
      ["Midnight Snack Box", 19, "🍿", "Snacks", ["limited"], "A curated 2am experience: sweet, salty, crunchy, and one mystery item."],
      ["Sunrise Açaí Bowl", 12, "🫐", "Meals", [], "Granola, berries, and the smug satisfaction of a healthy choice."],
      ["Dragon Roll Sushi Set", 22, "🍣", "Meals", ["staff"], "Twelve pieces of architecture you can eat. Wasabi calibrated to 'brave'."],
      ["Street Taco Trio", 11, "🌮", "Meals", [], "Al pastor, carne asada, and one wildcard. Double tortilla, no notes."],
      ["Honey Butter Croissant", 5, "🥐", "Desserts", ["new"], "Seventy-two imaginary layers of laminated joy. Flake radius: two meters."],
    ],
    home: [
      ["AuroraStrip LED Kit 5m", 39, "💫", "Lighting", ["bestseller"], "Music-sync mode turns your ceiling into the aurora borealis, localized entirely in your room."],
      ["LumenArc Desk Lamp", 69, "🪔", "Lighting", [], "Wireless charging base, infinite dimming, and an arc that looks like modern art."],
      ["Monstera 'Big Leaf' Plant", 45, "🪴", "Decor", ["staff"], "Thrives on neglect and compliments. Comes pre-loved by an imaginary greenhouse."],
      ["CloudNine Bean Bag", 129, "🛋️", "Decor", ["bestseller"], "Memory foam the size of a small moon. Getting out is a tomorrow problem."],
      ["NeonFrame Wall Art", 89, "🖼️", "Decor", [], "LED-lined print that makes any wall the main character."],
      ["StackrCube Storage Set", 49, "🗄️", "Storage", [], "Six modular cubes that turn chaos into 'aesthetic minimalism'."],
      ["SizzleChef Air Fryer XL", 119, "🍳", "Kitchen", ["trending"], "Crispy everything, zero guilt, one appliance now responsible for 80% of your meals."],
      ["ZenBrew Pour-Over Kit", 54, "🫖", "Kitchen", [], "Gooseneck kettle, glass dripper, and the moral high ground over pod coffee."],
      ["DriftScent Diffuser", 39, "🕯️", "Decor", [], "Ultrasonic mist plus 'Rainy Bookstore' oil. Your room, but cinematic."],
      ["OrbitClock Levitating Clock", 99, "🕰️", "Decor", ["limited"], "The hour marker floats via fictional magnets. Guests will demand an explanation."],
    ],
    auto: [
      ["TurboShine Detail Kit", 49, "🧽", "Care", [], "Foam cannon, microfiber army, and a shine that resets your car to showroom."],
      ["FrostByte Car Vacuum", 69, "🌪️", "Gadgets", [], "Cordless cyclone that finds fries from road trips you don't remember taking."],
      ["MidnightPine Fresheners 3pk", 12, "🌲", "Interior", ["new"], "Smells like a forest that also went to design school."],
      ["MagLock Phone Mount", 29, "🧲", "Gadgets", ["bestseller"], "Snaps on one-handed at a red light. Holds through potholes and questionable playlists."],
      ["GuardianEye Dash Cam", 129, "📹", "Gadgets", ["staff"], "4K front and rear witness. Night vision sharp enough to read regret."],
      ["AllWeather Floor Mats", 79, "🛞", "Interior", [], "Laser-measured fictional fit. Contains spills, mud, and juice box incidents."],
      ["BoostAir Tire Inflator", 59, "🎈", "Gadgets", [], "Auto-stops at target PSI. The low-pressure light fears you now."],
      ["NightRider Underglow Kit", 89, "🚗", "Interior", ["limited"], "App-controlled glow. Technically street-legal in the fictional universe."],
      ["ApexWax Ceramic Coat", 39, "✨", "Care", [], "Water beads so hard it looks like CGI. Lasts six imaginary months."],
      ["CargoNet Trunk Organizer", 25, "🕸️", "Interior", [], "Groceries stay upright. The rogue orange era is over."],
    ],
    beauty: [
      ["GlassSkin Hydra Serum", 42, "💎", "Skincare", ["bestseller"], "Hyaluronic everything. Your face, but with the clarity filter built in."],
      ["VelvetCloud Moisturizer", 36, "🌥️", "Skincare", [], "Whipped, weightless, and gone in three seconds. Dry patches never happened."],
      ["PureFoam Gel Cleanser", 24, "🧼", "Skincare", [], "Removes sunscreen, city, and the general concept of Monday."],
      ["SolarShield SPF 50", 28, "☀️", "Skincare", ["staff"], "No white cast, no grease, no excuse. Future you says thanks."],
      ["HoneyDrop Lip Balm Trio", 15, "🍯", "Care", ["new"], "Honey, vanilla, and salted caramel. You will lose two. That's why it's a trio."],
      ["NoirEssence Cologne", 89, "🌑", "Fragrance", ["limited"], "Smoked cedar and amber. Two compliments per wear, fictionally guaranteed."],
      ["MidnightOud Body Wash", 22, "🛁", "Care", [], "A ten-minute shower becomes a forty-minute lore-building session."],
      ["BrightByte Whitening Kit", 49, "🦷", "Care", [], "LED tray plus gel. Your smile, remastered in HD."],
      ["RoseQuartz Face Roller", 26, "🌹", "Skincare", ["trending"], "Cold stone, warm reviews. De-puffs mornings and existential dread."],
      ["AquaMist Toner Spray", 21, "🌫️", "Skincare", [], "Three-second reset button for your face. Cucumber optional, drama free."],
    ],
    office: [
      ["InkFlow Dotted Notebook", 18, "📓", "Paper", [], "160gsm pages with zero ghosting. Your bullet journal era starts now."],
      ["GlidePen Gel Set (12)", 14, "🖊️", "Tools", ["bestseller"], "0.5mm lines so smooth your handwriting gets a promotion."],
      ["UrbanPack Pro Backpack", 89, "🎒", "Carry", ["trending"], "Laptop cave, hidden pockets, and a back panel that breathes better than you in a meeting."],
      ["MathCore Calculator", 29, "🧮", "Tools", [], "Solves everything except word problems about trains."],
      ["FocusDock Organizer", 39, "🗂️", "Desk", [], "A home for pens, cables, and the seven chapsticks you own apparently."],
      ["StickyBrain Note Cubes", 9, "🗒️", "Paper", ["new"], "800 neon sticky notes. Your monitor bezel is about to become a mosaic."],
      ["LaserJot Smart Pen", 129, "✒️", "Tools", ["limited"], "Digitizes handwriting in real time, typos and doodles included."],
      ["DeskZen Monitor Stand", 49, "🪜", "Desk", [], "Raises your screen and your posture's self-esteem. Drawer included."],
      ["ChronoTimer Focus Cube", 25, "⏲️", "Desk", ["staff"], "Flip for 25 minutes of pure focus. Procrastination hates this one trick."],
      ["PaperTrail Planner", 22, "📅", "Paper", [], "Weekly spreads, habit trackers, and one guilt-free skipped week."],
    ],
  };

  /* ── Build catalog with stable derived stats ────────────── */
  const PRODUCTS = [];
  const BY_ID = {};

  CATEGORIES.forEach((cat) => {
    (DEFS[cat.id] || []).forEach((d, i) => {
      const [name, price, emoji, sub, badges, blurb, hairTypes] = d;
      const id = `${cat.id}-${i + 1}`;
      const h = hash(id + name);
      const p = {
        id, cat: cat.id, name, price, emoji, sub,
        badges: badges || [],
        blurb,
        desc: `${blurb} ${cat.boiler}`,
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
    const picks = pickSeeded(PRODUCTS.filter((p) => p.price >= 20), 6, seed);
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
    "The hype is real. The product is not. Somehow still worth it.",
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
    { v: "1.0.0", notes: ["Initial release", "10 categories, 100+ fictional products", "Live order tracking with fake map", "Rewards: XP, coins, streaks, spins, mystery boxes", "5 unlockable themes", "Full offline support (PWA)"] },
  ];

  const HAIR_TYPES = ["straight", "wavy", "curly", "coily", "fine", "thick", "dry", "oily", "damaged", "frizzy"];

  return {
    VERSION, CATEGORIES, PRODUCTS, COUPONS, DRIVERS, BADGES, CHANGELOG, HAIR_TYPES,
    byId, byCat, category, search, flashSale, dailyPicks, reviewsFor,
  };
})();
