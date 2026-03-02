// Shared collectibles data for both app and collection pages
const collectibles = {
    // DEFAULT - Gradient marbles (10 colors)
    marble: {
        name: 'Marbles',
        images: [], // Marbles are rendered with CSS gradients, no images needed
        itemNames: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Purple', 'Magenta', 'Teal', 'Gray'],
        itemDescriptions: [
            'Smooth and vibrant, this Red marble rolls like a little ruby through your fingers.',
            'Warm as sunshine, the Orange marble brings a touch of citrus cheer to your collection.',
            'Bright and sunny, the Yellow marble glows like a drop of golden honey.',
            'Fresh as spring grass, the Green marble carries the calm of a quiet meadow.',
            'Cool and clear as the sky, the Blue marble feels like a tiny piece of summer.',
            'Deep and mysterious, the Indigo marble holds the color of twilight.',
            'Royal and elegant, the Purple marble shines with regal grace.',
            'Bold and playful, the Magenta marble pops with vibrant energy.',
            'Calm as the sea, the Teal marble bridges blue and green in perfect harmony.',
            'Subtle and timeless, the Gray marble has a quiet, understated beauty.'
        ],
        fallbackColors: ['#E53935', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3', '#3F51B5', '#9C27B0', '#E91E63', '#009688', '#607D8B'],
        marbleGradients: [
            'radial-gradient(circle at 30% 30%, #EF5350 0%, #E53935 50%, #C62828 100%)',
            'radial-gradient(circle at 30% 30%, #FFB74D 0%, #FF9800 50%, #F57C00 100%)',
            'radial-gradient(circle at 30% 30%, #FFF176 0%, #FFEB3B 50%, #F9A825 100%)',
            'radial-gradient(circle at 30% 30%, #81C784 0%, #4CAF50 50%, #388E3C 100%)',
            'radial-gradient(circle at 30% 30%, #64B5F6 0%, #2196F3 50%, #1976D2 100%)',
            'radial-gradient(circle at 30% 30%, #7986CB 0%, #3F51B5 50%, #303F9F 100%)',
            'radial-gradient(circle at 30% 30%, #BA68C8 0%, #9C27B0 50%, #7B1FA2 100%)',
            'radial-gradient(circle at 30% 30%, #F06292 0%, #E91E63 50%, #C2185B 100%)',
            'radial-gradient(circle at 30% 30%, #4DB6AC 0%, #009688 50%, #00796B 100%)',
            'radial-gradient(circle at 30% 30%, #90A4AE 0%, #607D8B 50%, #455A64 100%)'
        ],
        sounds: { min: 400, max: 700 },
        size: 26,
        isMarble: true
    },

    // ANIMALS
    cat: {
        name: '🐱 Cats',
        images: [
            'https://cdn-icons-png.flaticon.com/128/1864/1864514.png',
            'https://cdn-icons-png.flaticon.com/128/12402/12402429.png',
            'https://cdn-icons-png.flaticon.com/128/763/763741.png',
            'https://cdn-icons-png.flaticon.com/128/8467/8467040.png',
            'https://cdn-icons-png.flaticon.com/128/2213/2213643.png',
            'https://cdn-icons-png.flaticon.com/128/8467/8467043.png',
            'https://cdn-icons-png.flaticon.com/128/7924/7924645.png',
            'https://cdn-icons-png.flaticon.com/128/8503/8503716.png',
            'https://cdn-icons-png.flaticon.com/128/375/375112.png',
            'https://cdn-icons-png.flaticon.com/128/14257/14257529.png'
        ],
        itemNames: ['Fluffy', 'Midnight', 'Whiskers', 'Brulee', 'Ash', 'Oreo', 'Luna', 'Licorice', 'Custard', 'Noodle'],
        itemDescriptions: [
            'Fluffy is a friendly lap cat who purrs on contact and follows you room to room.',
            'Midnight is affectionate and gentle, always ready for head boops and slow blinks.',
            'Whiskers is a curious social butterfly who investigates everything, including your keyboard.',
            'Brulee is sweet but selective, cuddly on schedule and bossy before breakfast.',
            'Ash is a playful goofball with zoomies at night and dramatic meows for treats.',
            'Oreo is a distant observer who keeps a cool vibe but secretly watches over everyone.',
            'Luna is a quiet, loving shadow cat who appears exactly when you need comfort.',
            'Licorice is a moody diva who switches from cuddles to side-eye in under three seconds.',
            'Custard is a food-motivated charmer, friendly when snacks appear and opinionated when late.',
            'Noodle is a tiny chaos gremlin: curious, clingy, and occasionally angry about closed doors.'
        ],
        fallbackColors: ['#FFB6C1', '#DDA0DD', '#F0E68C', '#98D8C8', '#87CEEB', '#FFC0CB', '#E6E6FA', '#FFE4E1', '#DDA0DD', '#F5DEB3'],
        sounds: { min: 500, max: 800 },
        size: 28
    },
    dog: {
        name: '🐶 Dogs',
        images: [
		'https://cdn-icons-png.flaticon.com/128/3089/3089512.png',
		'https://cdn-icons-png.flaticon.com/128/1049/1049339.png',
		'https://cdn-icons-png.flaticon.com/128/3089/3089464.png',
		'https://cdn-icons-png.flaticon.com/128/1180/1180264.png',
		'https://cdn-icons-png.flaticon.com/128/1049/1049334.png',
		'https://cdn-icons-png.flaticon.com/128/1049/1049332.png',
		'https://cdn-icons-png.flaticon.com/128/1049/1049352.png',
		'https://cdn-icons-png.flaticon.com/128/1049/1049355.png',
		'https://cdn-icons-png.flaticon.com/128/8182/8182986.png',
		'https://cdn-icons-png.flaticon.com/128/3089/3089528.png'
        ],

        itemNames: ['Buddy', 'Cooper', 'Max', 'Charlie', 'Teddy', 'Oliver', 'Duke', 'Tucker', 'Bear', 'Murphy'],
        itemDescriptions: [
            'Buddy is a friendly greeter who treats every visitor like a long-lost best friend.',
            'Cooper is cheerful and upbeat, wagging through life like every day is a celebration.',
            'Max is a cute little guard dog who takes watch duty seriously between snack breaks.',
            'Charlie is a gentle sweetheart who proudly escorts you to work like an official coworker.',
            'Teddy is all bark and no bite, sounding fierce but melting for belly rubs.',
            'Oliver is moral and good, always choosing the kind path and keeping everyone in line.',
            'Duke is a slightly emo protector who stares into the distance between dramatic sighs.',
            'Tucker survives on daily caffeine and powers through walks like a furry espresso machine.',
            'Bear adores cardboard boxes and curls up inside them like an oversized cat.',
            'Murphy is a goofy charmer with expressive eyes and a permanent wagging tail.'
        ],
        fallbackColors: ['#DEB887', '#D2B48C', '#F5DEB3', '#FFDAB9', '#FFE4C4', '#E6C9A8', '#D4A574', '#D2691E', '#8B4513', '#F5DEB3'],
        sounds: { min: 300, max: 500 },
        size: 28
    },
    bunny: {
        name: '🐰 Bunnies',
        images: [
'https://cdn-icons-png.flaticon.com/128/14992/14992721.png',
'https://cdn-icons-png.flaticon.com/128/2663/2663327.png',
'https://cdn-icons-png.flaticon.com/128/1660/1660565.png',
'https://cdn-icons-png.flaticon.com/128/3507/3507047.png',
'https://cdn-icons-png.flaticon.com/128/8493/8493168.png',
'https://cdn-icons-png.flaticon.com/128/5872/5872050.png',
'https://cdn-icons-png.flaticon.com/128/8160/8160949.png',
'https://cdn-icons-png.flaticon.com/128/1581/1581628.png',
'https://cdn-icons-png.flaticon.com/128/8677/8677462.png',
'https://cdn-icons-png.flaticon.com/128/2663/2663100.png'
        ],
        itemNames: ['Cotton', 'Blue', 'River', 'Dusty', 'Poof', 'Poppy', 'Hopper', 'Pepper', 'Thistle', 'Sky'],
        itemDescriptions: [
            'Cotton is soft and friendly, happiest when gently pet and offered leafy snacks.',
            'Blue is a curious explorer who sniffs everything before deciding it is safe.',
            'River is shy at first, then suddenly zooms around with happy bunny binkies.',
            'Dusty is a calm cuddle bunny who prefers cozy corners and quiet company.',
            'Poof is playful and social, always first to hop over for attention.',
            'Poppy is an energetic little hopper with nonstop curiosity and tiny dramatic pauses.',
            'Hopper is a gentle soul who likes routine, soft voices, and tidy hideouts.',
            'Pepper is a snack detective who can hear a treat bag from across the room.',
            'Thistle is independent but affectionate, asking for love on bunny-approved timing.',
            'Sky is sweet and trusting, following you around once you earn friendship.'
        ],
        fallbackColors: ['#FFE4E1', '#FFF0F5', '#F5F5DC', '#FFFAF0', '#FDF5E6', '#FFF8DC', '#FAEBD7', '#FFEFD5', '#FFE4B5', '#DEB887'],
        sounds: { min: 400, max: 650 },
        size: 26
    },
    bear: {
        name: '🧸 Bears',
        images: [
'https://cdn-icons-png.flaticon.com/128/9508/9508699.png',
'https://cdn-icons-png.flaticon.com/128/8288/8288533.png',
'https://cdn-icons-png.flaticon.com/128/452/452538.png',
'https://cdn-icons-png.flaticon.com/128/7862/7862803.png',
'https://cdn-icons-png.flaticon.com/128/8179/8179925.png',
'https://cdn-icons-png.flaticon.com/128/7107/7107882.png',
'https://cdn-icons-png.flaticon.com/128/1660/1660670.png',
'https://cdn-icons-png.flaticon.com/128/4509/4509587.png',
'https://cdn-icons-png.flaticon.com/128/3632/3632825.png',
'https://cdn-icons-png.flaticon.com/128/534/534691.png'
        ],
        itemNames: ['Teddy', 'Bruno', 'Gums', 'Grizzle', 'Tubby', 'Fuzzy', 'Dots', 'Theo', 'Snooze', 'Snickers'],
        itemDescriptions: [
            'Teddy loves to nap till noon with a cozy tune. Teddy wakes with a grin and a happy spin.',
            'Bruno stomps through the pines and still looks fine. Bruno snacks in the shade like a parade.',
            'Gums finds golden treats by the buzzing bees. Gums hums with delight in the morning light.',
            'Grizzle has a mighty roar by the river shore. Grizzle chills in the sun when the day is done.',
            'Tubby snoozes till noon beneath the moon. Tubby hugs a pillow tight all through the night.',
            'Fuzzy wears a fluffy coat that feels like a boat. Fuzzy bounces in place with a smiley face.',
            'Dots moves so slow in a cozy glow. Dots skips each chore and naps on the floor.',
            'Theo is sweet as snow with a gentle glow. Theo floats around without a sound.',
            'Snooze dozes mid-stride with a yawn so wide. Snooze nods off anywhere, then wakes without a care.',
            'Snickers cracks little jokes by the old oak. Snickers giggles all day in a playful way.'
        ],
        fallbackColors: ['#D2691E', '#8B4513', '#F5F5F5', '#A0522D', '#000000', '#DEB887', '#8B7355', '#CD853F', '#BC8F8F', '#A08060'],
        sounds: { min: 250, max: 450 },
        size: 28
    },
    bird: {
        name: '🐦 Birds',
        images: [
'https://cdn-icons-png.flaticon.com/128/789/789479.png',
'https://cdn-icons-png.flaticon.com/128/2977/2977364.png',
'https://cdn-icons-png.flaticon.com/128/6267/6267384.png',
'https://cdn-icons-png.flaticon.com/128/4039/4039799.png',
'https://cdn-icons-png.flaticon.com/128/9466/9466855.png',
'https://cdn-icons-png.flaticon.com/128/8112/8112200.png',
'https://cdn-icons-png.flaticon.com/128/6288/6288389.png',
'https://cdn-icons-png.flaticon.com/128/1660/1660644.png',
'https://cdn-icons-png.flaticon.com/128/6616/6616071.png',
'https://cdn-icons-png.flaticon.com/128/1635/1635928.png'
        ],
        itemNames: ['Rio', 'Gerald', 'Berry', 'Sunny', 'Chickie', 'Chirpy', 'Leo', 'Squeaker', 'Lovebirds', 'Gem'],
        itemDescriptions: [
            'Rio loves fruit-heavy snacks and shows off glossy plumage with flashy little hops.',
            'Gerald prefers seeds and tender shoots, then performs looping flight displays to impress.',
            'Berry forages for insects in short bursts and keeps feathers neat for courtship season.',
            'Sunny enjoys berries at sunrise and uses bright chest feathers in partner dances.',
            'Chickie snacks on grains and tiny bugs, with iridescent tones that shimmer in sunlight.',
            'Chirpy is grand and patriotic, strutting proudly with bold songs and parade-ready plumage.',
            'Leo likes nuts and scraps and will bring you little presents like a proud neighborhood collector.',
            'Squeaker loves eating millet and chirps with delight whenever a fresh seed mix appears.',
            'Lovebirds feed in bonded pairs, preen each other constantly, and seal romance with synchronized chirps.',
            'Gem loves sweet fruit and vivid plumage, finishing courtship with playful head-bobs.'
        ],
        fallbackColors: ['#FFD700', '#87CEEB', '#FF6347', '#DEB887', '#98FB98', '#DC143C', '#20B2AA', '#8B4513', '#32CD32', '#FFD700'],
        sounds: { min: 600, max: 900 },
        size: 24
    },
    penguin: {
        name: '🐧 Penguins',
        images: [
'https://cdn-icons-png.flaticon.com/128/2608/2608777.png',
'https://cdn-icons-png.flaticon.com/128/6274/6274596.png',
'https://cdn-icons-png.flaticon.com/128/1717/1717937.png',
'https://cdn-icons-png.flaticon.com/128/9113/9113210.png',
'https://cdn-icons-png.flaticon.com/128/3930/3930575.png',
'https://cdn-icons-png.flaticon.com/128/614/614140.png',
'https://cdn-icons-png.flaticon.com/128/7412/7412146.png',
'https://cdn-icons-png.flaticon.com/128/7333/7333346.png',
'https://cdn-icons-png.flaticon.com/128/3632/3632867.png',
'https://cdn-icons-png.flaticon.com/128/1660/1660713.png'
        ],
        itemNames: ['Pebble', 'Pingu', 'Slide', 'Frosty', 'Thorn', 'Tux', 'Plinky', 'Splash', 'Scruffy', 'Bubbles'],
        itemDescriptions: [
            'Honk-honk, Pebble announces snack time to the entire iceberg.',
            'Squawk-squawk, Pingu narrates every dramatic slide like a sportscaster.',
            'Skid-skid, Slide zooms past on a belly glide with maximum confidence.',
            'Brrr-brrr, Frosty shivers theatrically even when it is not that cold.',
            'Chomp-chomp, Thorn never says no to a crunchy fishy snack.',
            'Flap-flap, Tux gives a formal wing wave before every belly slide.',
            'Plink-plink, Plinky glides past like a tiny penguin race car.',
            'Splish-splash, Splash turns every puddle into a personal water park.',
            'Scruff-scruff, Scruffy tackles dinner with champion-level enthusiasm.',
            'Pop-pop, Bubbles laughs in little blurps while diving underwater.'
        ],
        fallbackColors: ['#2F4F4F', '#708090', '#B0C4DE', '#E0FFFF', '#F0FFFF', '#4682B4', '#5F9EA0', '#87CEEB', '#B0E0E6', '#ADD8E6'],
        sounds: { min: 350, max: 550 },
        size: 26
    },
    fox: {
        name: '🦊 Foxes',
        images: [
'https://cdn-icons-png.flaticon.com/128/8493/8493052.png',
'https://cdn-icons-png.flaticon.com/128/5414/5414810.png',
'https://cdn-icons-png.flaticon.com/128/6267/6267185.png',
'https://cdn-icons-png.flaticon.com/128/3506/3506994.png',
'https://cdn-icons-png.flaticon.com/128/8709/8709818.png',
'https://cdn-icons-png.flaticon.com/128/1806/1806532.png',
'https://cdn-icons-png.flaticon.com/128/6368/6368882.png',
'https://cdn-icons-png.flaticon.com/128/1806/1806599.png',
'https://cdn-icons-png.flaticon.com/128/2105/2105902.png',
'https://cdn-icons-png.flaticon.com/128/1635/1635937.png'
        ],
        itemNames: ['Rusty', 'Ember', 'Sleet', 'Copper', 'Ginger', 'Scarlet', 'Gray', 'Blaze', 'Flame', 'Auburn'],
        itemDescriptions: [
            'Favorite snack: crunchy field mice with a side of midnight zoomies.',
            'Lives for juicy berries and whatever snacks can be politely stolen from camp.',
            'Loves winter hunts through fresh snow, tracking tiny prints beneath frosty pine trees.',
            'Always hunting for rabbits, then celebrating with a berry dessert.',
            'Claims beetles are gourmet and insists worms are an acquired taste.',
            'Always carrying a tiny camera, Scarlet loves snapping photos of forests, sunsets, and friends.',
            'Favorite meal is a plump vole, preferably chased through autumn leaves.',
            'Blaze listens to music while on the move, bobbing along to every beat through the trees.',
            'Obsessed with fish from shallow streams and crunchy crayfish on the side.',
            'Chooses grapes, plums, and late-night mouse snacks in equal measure.'
        ],
        fallbackColors: ['#FF8C00', '#FF6347', '#FF4500', '#FFD700', '#FFA500', '#CD853F', '#D2691E', '#8B4513', '#A0522D', '#DEB887'],
        sounds: { min: 400, max: 700 },
        size: 26
    },
    seaLife: {
        name: '🐠 Sea Life',
        images: [
'https://cdn-icons-png.flaticon.com/128/2977/2977402.png',
'https://cdn-icons-png.flaticon.com/128/1867/1867540.png',
'https://cdn-icons-png.flaticon.com/128/2036/2036160.png',
'https://cdn-icons-png.flaticon.com/128/1861/1861999.png',
'https://cdn-icons-png.flaticon.com/128/874/874960.png',
'https://cdn-icons-png.flaticon.com/128/4633/4633486.png',
'https://cdn-icons-png.flaticon.com/128/6789/6789494.png',
'https://cdn-icons-png.flaticon.com/128/6789/6789549.png',
'https://cdn-icons-png.flaticon.com/128/2977/2977322.png',
'https://cdn-icons-png.flaticon.com/128/1717/1717864.png'
        ],
        itemNames: ['Shelly', 'Bluefin', 'Pinchy', 'Starlight', 'Bubbles', 'Wobble', 'Riptide', 'Spiky', 'Opal', 'Skipper'],
        itemDescriptions: [
            'Old soul, slow pace, zero stress, and always carrying the house keys.',
            'Gentle giant with a podcast voice and surprisingly dramatic splash exits.',
            'Sideways walker, straight-talker, and undefeated in tiny arguments.',
            'Bright, chill, and fully committed to star-quality posing.',
            'Goofy extrovert who can turn any reef into a comedy show.',
            'Squishy philosopher drifting through life with excellent vibes.',
            'Looks intimidating, actually just hyper-focused and over-caffeinated.',
            'Spiky on the outside, soft on the inside, deeply misunderstood.',
            'Quiet luxury in shell form with impeccable taste.',
            'Small, speedy, and always somehow in on the gossip.'
        ],
        fallbackColors: ['#FFD700', '#FF6347', '#FFB6C1', '#9370DB', '#4169E1', '#87CEEB', '#20B2AA', '#FF69B4', '#DC143C', '#3CB371'],
        sounds: { min: 300, max: 600 },
        size: 26
    },
    butterfly: {
        name: '🦋 Butterflies',
        images: [
'https://cdn-icons-png.flaticon.com/128/10404/10404149.png',
'https://cdn-icons-png.flaticon.com/128/1447/1447896.png',
'https://cdn-icons-png.flaticon.com/128/7651/7651038.png',
'https://cdn-icons-png.flaticon.com/128/2657/2657878.png',
'https://cdn-icons-png.flaticon.com/128/1779/1779644.png',
'https://cdn-icons-png.flaticon.com/128/10402/10402576.png',
'https://cdn-icons-png.flaticon.com/128/7803/7803586.png',
'https://cdn-icons-png.flaticon.com/128/9486/9486943.png',
'https://cdn-icons-png.flaticon.com/128/2460/2460266.png',
'https://cdn-icons-png.flaticon.com/128/688/688343.png'
        ],
        itemNames: ['Flutter', 'Rosy', 'Chili', 'Shimmer', 'Willow', 'Pearl', 'Zephyr', 'Dusty', 'Moonbeam', 'Blossom'],
        itemDescriptions: [
            'Playful and energetic, always first to explore a new flower.',
            'Graceful and social, turns every garden visit into an event.',
            'Calm and curious, happiest drifting wherever the breeze leads.',
            'Flashy and confident, loves making a sparkling entrance.',
            'Gentle and thoughtful, the quiet friend everyone trusts.',
            'Elegant and poised, keeps things classy no matter the weather.',
            'Fast-talking and free-spirited, never in one place for long.',
            'A little mysterious and artsy, sees beauty in every corner.',
            'Dreamy and soft-spoken, most active when the sky turns silver.',
            'Warm and cheerful, naturally brings bright energy to the group.'
        ],
        fallbackColors: ['#FF8C00', '#4169E1', '#FFB6C1', '#9400D3', '#00CED1', '#FFD700', '#FF1493', '#32CD32', '#1E90FF', '#FF69B4'],
        sounds: { min: 500, max: 800 },
        size: 24
    },

    // FOOD & TREATS
    dessert: {
        name: '🍩 Desserts',
        images: [
'https://cdn-icons-png.flaticon.com/128/2608/2608473.png',
'https://cdn-icons-png.flaticon.com/128/11788/11788487.png',
'https://cdn-icons-png.flaticon.com/128/2002/2002690.png',
'https://cdn-icons-png.flaticon.com/128/11899/11899746.png',
'https://cdn-icons-png.flaticon.com/128/7401/7401592.png',
'https://cdn-icons-png.flaticon.com/128/12391/12391190.png',
'https://cdn-icons-png.flaticon.com/128/1175/1175754.png',
'https://cdn-icons-png.flaticon.com/128/1863/1863697.png',
'https://cdn-icons-png.flaticon.com/128/7401/7401668.png',
'https://cdn-icons-png.flaticon.com/128/11788/11788447.png'
        ],
        itemNames: ['Cotton Candy', 'Sundae', 'Donut', 'Wafer Scoops', 'Strawberry Ice', 'Cake', 'Slice', 'Fruit Pastry', 'Cherry Scoops', 'Drippy Scoops'],
        itemDescriptions: [
            'Looks light and fluffy, but it still knows how to stick around.',
            'Sweet, layered, and best enjoyed when things get a little messy.',
            'Round, irresistible, and impossible to stop at just one.',
            'Crunch on the outside, soft in the middle, full of mixed signals.',
            'Cold at first, then suddenly melting the whole room.',
            'Always the center of attention and never apologizes for it.',
            'Just a small piece, but somehow it changes the whole mood.',
            'Flaky, fruity, and dressed to impress with very little effort.',
            'Double scoops with a cherry on top, because subtlety is overrated.',
            'A little extra, a little dramatic, and absolutely worth it.'
        ],
        fallbackColors: ['#FFB6C1', '#FF69B4', '#FFD700', '#D2691E', '#FFC0CB', '#E6E6FA', '#8B4513', '#DEB887', '#F5DEB3', '#D2B48C'],
        sounds: { min: 400, max: 700 },
        size: 26
    },
    fruit: {
        name: '🍓 Fruits',
        images: [
'https://cdn-icons-png.flaticon.com/128/2578/2578768.png',
'https://cdn-icons-png.flaticon.com/128/1391/1391394.png',
'https://cdn-icons-png.flaticon.com/128/1907/1907128.png',
'https://cdn-icons-png.flaticon.com/128/2146/2146656.png',
'https://cdn-icons-png.flaticon.com/128/2039/2039361.png',
'https://cdn-icons-png.flaticon.com/128/1012/1012419.png',
'https://cdn-icons-png.flaticon.com/128/2396/2396691.png',
'https://cdn-icons-png.flaticon.com/128/5415/5415311.png',
'https://cdn-icons-png.flaticon.com/128/11639/11639363.png',
'https://cdn-icons-png.flaticon.com/128/13461/13461240.png'
        ],
        itemNames: ['Cherries', 'Apple', 'Pineapple', 'Orange', 'Grapes', 'Strawberry', 'Lemon', 'Peach', 'Banana', 'Lychee'],
        itemDescriptions: [
            'Cherries bring that sweet-tart pop and always look like they arrived in pairs for a reason.',
            'Apples stay crisp, juicy, and snack-ready like they were designed for busy days.',
            'Pineapples are tropical armor on the outside and sunshine on the inside.',
            'Oranges are basically nature-made juice boxes with built-in vitamin C.',
            'Grapes are tiny flavor balloons that can be sweet, tart, or turned into raisins.',
            'Strawberries smell like summer and wear their seeds on the outside with confidence.',
            'Lemons are sharp, bright, and capable of upgrading almost any drink or dish.',
            'Peaches are soft, fragrant, and famous for that perfect sweet drip when ripe.',
            'Bananas come with their own easy-open packaging and instant smoothie potential.',
            'Lychee hides floral sweetness under a bumpy shell like a tiny treasure fruit.'
        ],
        fallbackColors: ['#FF6B6B', '#FF6347', '#DC143C', '#FFDAB9', '#FFA500', '#FF4500', '#6B2D5C', '#FFD700', '#90EE90', '#4169E1'],
        sounds: { min: 350, max: 600 },
        size: 26
    },
    candy: {
        name: '🍬 Candy',
        images: [
'https://cdn-icons-png.flaticon.com/128/3714/3714124.png',
'https://cdn-icons-png.flaticon.com/128/1075/1075135.png',
'https://cdn-icons-png.flaticon.com/128/1152/1152198.png',
'https://cdn-icons-png.flaticon.com/128/407/407696.png',
'https://cdn-icons-png.flaticon.com/128/119/119535.png',
'https://cdn-icons-png.flaticon.com/128/2234/2234389.png',
'https://cdn-icons-png.flaticon.com/128/11899/11899812.png',
'https://cdn-icons-png.flaticon.com/128/2913/2913945.png',
'https://cdn-icons-png.flaticon.com/128/1301/1301901.png',
'https://cdn-icons-png.flaticon.com/128/1327/1327930.png'
        ],
        itemNames: ['Candy Cane', 'Gumballs', 'Chocolate', 'Candy Corn', 'Strawberry Candy', 'Peppermint', 'Jelly Beans', 'Gummies', 'Candies', 'Lollipops'],
        itemDescriptions: [
            'The candy cane became a holiday icon thanks to its hook shape and red-white stripes.',
            'Gumballs turned candy into an activity, because chewing is half the fun.',
            'Chocolate starts as cacao beans and ends as everyone suddenly being nicer.',
            'Candy corn has been around since the 1800s and still starts debates every Halloween.',
            'Strawberry candy is usually wrapped like a tiny strawberry, making it candy and costume design.',
            'Peppermint gets its cool kick from menthol, the part that makes it feel extra fresh.',
            'Jelly beans became famous for huge flavor variety and strategic bean-by-bean choosing.',
            'Gummies were inspired by gummy bears and proved candy can also be cute.',
            'The word candy comes from a root meaning crystallized sugar, sweet history included.',
            'Lollipops made candy portable by putting the treat on a stick, a very efficient invention.'
        ],
        fallbackColors: ['#FF69B4', '#FF0000', '#FFD700', '#8B4513', '#9370DB', '#FF1493', '#32CD32', '#00CED1', '#98FB98', '#FFB6C1'],
        sounds: { min: 450, max: 750 },
        size: 24
    },
    boba: {
        name: '🧋 Drinks',
        images: [
'https://cdn-icons-png.flaticon.com/128/3361/3361216.png',
'https://cdn-icons-png.flaticon.com/128/4645/4645885.png',
'https://cdn-icons-png.flaticon.com/128/7922/7922993.png',
'https://cdn-icons-png.flaticon.com/128/184/184473.png',
'https://cdn-icons-png.flaticon.com/128/1907/1907067.png',
'https://cdn-icons-png.flaticon.com/128/1149/1149810.png',
'https://cdn-icons-png.flaticon.com/128/7929/7929543.png',
'https://cdn-icons-png.flaticon.com/128/6411/6411156.png',
'https://cdn-icons-png.flaticon.com/128/2442/2442251.png',
'https://cdn-icons-png.flaticon.com/128/3142/3142825.png'
        ],
        itemNames: ['Boba', 'Baby Drink', 'Lightning', 'Redblue', 'Water', 'Coke', 'Milkshake', 'Coconut', 'Orange Juice', 'Juice Box'],
        itemDescriptions: [
            'Chewy pearls, big personality, and zero interest in being boring.',
            'Tiny cup, huge confidence, probably running on pure chaos.',
            'One sip and your to-do list suddenly looks conquerable.',
            'Two colors, one dramatic entrance.',
            'The quiet legend that keeps everyone functioning.',
            'Fizzy, bold, and slightly too good at stealing fries.',
            'Basically dessert pretending to be practical.',
            'Vacation energy in a shell with excellent hydration stats.',
            'Citrus sunshine with a built-in mood upgrade.',
            'Lunchbox royalty with portable main-character energy.'
        ],
        fallbackColors: ['#D2691E', '#9370DB', '#98FB98', '#FFB6C1', '#FFD700', '#DEB887', '#8B4513', '#FF6347', '#FFB6C1', '#90EE90'],
        sounds: { min: 300, max: 550 },
        size: 26
    },

    // NATURE
    flower: {
        name: '🌸 Flowers',
        images: [
'https://cdn-icons-png.flaticon.com/128/765/765848.png',
'https://cdn-icons-png.flaticon.com/128/6846/6846075.png',
'https://cdn-icons-png.flaticon.com/128/4759/4759056.png',
'https://cdn-icons-png.flaticon.com/128/15109/15109094.png',
'https://cdn-icons-png.flaticon.com/128/6454/6454501.png',
'https://cdn-icons-png.flaticon.com/128/2963/2963296.png',
'https://cdn-icons-png.flaticon.com/128/11639/11639273.png',
'https://cdn-icons-png.flaticon.com/128/1655/1655555.png',
'https://cdn-icons-png.flaticon.com/128/1143/1143351.png',
'https://cdn-icons-png.flaticon.com/128/2880/2880203.png'
        ],
        itemNames: ['Rose', 'Cherry Blossoms', 'Waves', 'Shine', 'Flower Basket', 'Justina', 'Sunny Flower', 'Cherry Bonsai', 'Violets', 'Sunny Earth'],
        itemDescriptions: [
            'Elegant, dramatic, and fully aware it is the main character.',
            'Soft pink confetti from nature for absolutely no reason except joy.',
            'Twice the blue, twice the mood, zero apologies.',
            'A tiny burst of sunshine that refuses to be subtle.',
            'A whole bouquet party carrying itself with confidence.',
            'Seven colors, one overachiever.',
            'Basically a solar panel, but adorable.',
            'Tiny tree energy with maximum zen and minimum chaos.',
            'Small, sweet, and quietly running the entire garden.',
            'Grounded, glowing, and suspiciously good at vibes.'
        ],
        fallbackColors: ['#FFB7C5', '#FF69B4', '#FFD700', '#FF6347', '#FFF0F5', '#FFFACD', '#FFB6C1', '#DA70D6', '#EE82EE', '#9370DB'],
        sounds: { min: 350, max: 600 },
        size: 26
    },
    plant: {
        name: '🌱 Plants',
        images: [
'https://cdn-icons-png.flaticon.com/128/628/628324.png',
'https://cdn-icons-png.flaticon.com/128/1320/1320905.png',
'https://cdn-icons-png.flaticon.com/128/1033/1033018.png',
'https://cdn-icons-png.flaticon.com/128/781/781410.png',
'https://cdn-icons-png.flaticon.com/128/3632/3632564.png',
'https://cdn-icons-png.flaticon.com/128/10485/10485032.png',
'https://cdn-icons-png.flaticon.com/128/9115/9115790.png',
'https://cdn-icons-png.flaticon.com/128/1655/1655584.png',
'https://cdn-icons-png.flaticon.com/128/9362/9362140.png',
'https://cdn-icons-png.flaticon.com/128/525/525906.png'
        ],
        itemNames: ['Succulent', 'Cactus', 'Venus Flytrap', 'Clover', 'Grow a Sun', 'Baby Tree', 'Orchid', 'Glass Succulent', 'Bonsai', 'Love Leaves'],
        itemDescriptions: [
            'I survive on sunlight, optimism, and the occasional accidental misting.',
            'I am not rude, I am just emotionally pointy.',
            'Come closer, I promise this is a networking event.',
            'Four leaves, one mission: making your luck look suspiciously easy.',
            'Tiny pot, huge ambition, absolutely zero chill.',
            'Currently pocket-sized, future provider of dramatic shade.',
            'I bloom on my own schedule and refuse to explain myself.',
            'Too pretty to water, too iconic to ignore.',
            'Proof that patience can also be incredibly stylish.',
            'Photosynthesizing romance one leaf at a time.'
        ],
        fallbackColors: ['#98FB98', '#228B22', '#90EE90', '#3CB371', '#2E8B57', '#556B2F', '#6B8E23', '#228B22', '#2F4F4F', '#8FBC8F'],
        sounds: { min: 300, max: 500 },
        size: 26
    },
    mushroom: {
        name: '🍄 Mushrooms',
        images: [
'https://cdn-icons-png.flaticon.com/128/2069/2069395.png',
'https://cdn-icons-png.flaticon.com/128/2396/2396827.png',
'https://cdn-icons-png.flaticon.com/128/2559/2559298.png',
'https://cdn-icons-png.flaticon.com/128/550/550507.png',
'https://cdn-icons-png.flaticon.com/128/1653/1653086.png',
'https://cdn-icons-png.flaticon.com/128/2119/2119232.png',
'https://cdn-icons-png.flaticon.com/128/4278/4278266.png',
'https://cdn-icons-png.flaticon.com/128/1192/1192483.png',
'https://cdn-icons-png.flaticon.com/128/1635/1635903.png',
'https://cdn-icons-png.flaticon.com/128/9053/9053615.png'
        ],
        itemNames: ['Red Cap', 'Brown', 'Shrooms', 'Toad', 'Magic Caps', 'Mushhouse', 'Shiitake', 'Button', 'Chanterelle', 'Enchante'],
        itemDescriptions: [
            'Red Cap has a classic dome top and storybook forest vibes.',
            'Brown is rich and earthy, with a grounded woodland look.',
            'Shrooms feels whimsical and fun, like a tiny fantasy grove.',
            'Toad has a bold, chunky cap that looks straight out of fairytales.',
            'Magic Caps looks cool-toned and enchanted, with a rare mystical feel.',
            'Mushhouse grows in cozy clustered shapes, like a little mushroom village.',
            'Shiitake is broad and hearty, with deep earthy character.',
            'Button is small and rounded, simple and familiar in the best way.',
            'Chanterelle has ruffled edges and elegant folds like a tiny golden trumpet.',
            'Enchante fans outward in layered shapes with a soft, magical flair.'
        ],
        fallbackColors: ['#FF6347', '#FFD700', '#9370DB', '#DAA520', '#4169E1', '#F5F5DC', '#8B4513', '#D2B48C', '#FFD700', '#BDB76B'],
        sounds: { min: 250, max: 450 },
        size: 24
    },
    weather: {
        name: '🌈 Weather',
        images: [
'https://cdn-icons-png.flaticon.com/128/2204/2204335.png',
'https://cdn-icons-png.flaticon.com/128/414/414825.png',
'https://cdn-icons-png.flaticon.com/128/2204/2204344.png',
'https://cdn-icons-png.flaticon.com/128/1409/1409254.png',
'https://cdn-icons-png.flaticon.com/128/4478/4478387.png',
'https://cdn-icons-png.flaticon.com/128/12053/12053571.png',
'https://cdn-icons-png.flaticon.com/128/1999/1999846.png',
'https://cdn-icons-png.flaticon.com/128/11016/11016038.png',
'https://cdn-icons-png.flaticon.com/128/7374/7374200.png',
'https://cdn-icons-png.flaticon.com/128/9986/9986669.png'
        ],
        itemNames: ['Sunny', 'Cloudy', 'Windy', 'Snowy', 'Partly Cloudy', 'Rainy', 'Hail', 'Lightning', 'Tornado', 'Rainbow'],
        itemDescriptions: [
            'Clear skies and bright sun, perfect for warm days and long shadows.',
            'A gray blanket of clouds that softens the light and cools the day.',
            'Air in motion, rustling trees and pushing clouds across the sky.',
            'Cold and quiet, with soft flakes turning everything bright and calm.',
            'A mix of sun and cloud, changing moods every few minutes.',
            'Steady drops from the sky that make windows sing and streets shine.',
            'Hard ice pellets that bounce, rattle, and disappear as quickly as they arrive.',
            'A fast electric flash that lights the sky before the thunder rolls.',
            'A powerful spinning column of wind, intense and impossible to ignore.',
            'A colorful arc that appears when sunlight meets raindrops at just the right angle.'
        ],
        fallbackColors: ['#FFD700', '#FF69B4', '#87CEEB', '#4169E1', '#E0FFFF', '#2F4F4F', '#F5F5F5', '#FFFACD', '#00FA9A', '#D3D3D3'],
        sounds: { min: 400, max: 700 },
        size: 26
    },

    // SPACE & MAGIC
    space: {
        name: '🚀 Space',
        images: [
'https://cdn-icons-png.flaticon.com/128/3132/3132035.png',
'https://cdn-icons-png.flaticon.com/128/4657/4657718.png',
'https://cdn-icons-png.flaticon.com/128/1794/1794530.png',
'https://cdn-icons-png.flaticon.com/128/3594/3594735.png',
'https://cdn-icons-png.flaticon.com/128/6024/6024820.png',
'https://cdn-icons-png.flaticon.com/128/1794/1794574.png',
'https://cdn-icons-png.flaticon.com/128/817/817757.png',
'https://cdn-icons-png.flaticon.com/128/1055/1055467.png',
'https://cdn-icons-png.flaticon.com/128/4898/4898169.png',
'https://cdn-icons-png.flaticon.com/128/3615/3615025.png'
        ],
        itemNames: ['Saturn', 'Earth', 'Rocket', 'Spaceship', 'Ringed Orb', 'Alien', 'Astronaut', 'Sattelite', 'Meteroid', 'Constellation'],
        itemDescriptions: [
            'A giant gas planet with iconic rings and dozens of icy moons.',
            'Our blue home world with oceans, weather, and life everywhere.',
            'A powerful launch vehicle built to break free from Earth’s gravity.',
            'A crewed or robotic craft designed to travel and maneuver in space.',
            'A mysterious ringed world glowing like a jewel in deep space.',
            'A curious visitor from beyond Earth, full of cosmic mystery.',
            'A trained space explorer who works in orbit under extreme conditions.',
            'An orbiting machine used for communication, navigation, and observation.',
            'A rocky body racing through space, often leaving a bright streak when it enters an atmosphere.',
            'A recognizable pattern of stars used for navigation and sky stories.'
        ],
        fallbackColors: ['#FF6347', '#9370DB', '#FFD700', '#00CED1', '#F5F5F5', '#C0C0C0', '#FFFACD', '#87CEEB', '#4B0082', '#2F4F4F'],
        sounds: { min: 600, max: 1000 },
        size: 26
    },
    magic: {
        name: '✨ Magic',
        images: [
'https://cdn-icons-png.flaticon.com/128/1692/1692220.png',
'https://cdn-icons-png.flaticon.com/128/3230/3230652.png',
'https://cdn-icons-png.flaticon.com/128/6956/6956913.png',
'https://cdn-icons-png.flaticon.com/128/2106/2106348.png',
'https://cdn-icons-png.flaticon.com/128/3330/3330480.png',
'https://cdn-icons-png.flaticon.com/128/12403/12403057.png',
'https://cdn-icons-png.flaticon.com/128/8282/8282903.png',
'https://cdn-icons-png.flaticon.com/128/7744/7744576.png',
'https://cdn-icons-png.flaticon.com/128/7244/7244913.png',
'https://cdn-icons-png.flaticon.com/128/1739/1739237.png'
        ],
        itemNames: ['Magic Hat', 'Magic Wand', 'Potion', 'Lamp', 'Broomstick', 'Spellbook', 'Cauldron', 'Magic Mirror', 'Mystic Orb', 'Sparkly Trunk'],
        itemDescriptions: [
            'The Magic Hat looked empty by day, but at midnight it pulled out exactly what the village needed most.',
            'With one gentle flick, the Magic Wand stitched broken things back together, including broken moods.',
            'The Potion changed color with each moon phase and always worked best when shared with a friend.',
            'An old Lamp glowed when someone made a brave wish, lighting paths hidden from ordinary eyes.',
            'The Broomstick only flew for kind-hearted riders and always took the scenic route through the clouds.',
            'The Spellbook rewrote itself each dawn, leaving one new spell for whoever turned the first page.',
            'The Cauldron bubbled with storm-blue steam and brewed courage stronger than any armor.',
            'The Magic Mirror never showed faces, only futures waiting for someone to choose them.',
            'Inside the Mystic Orb, tiny constellations shifted to answer questions asked with honesty.',
            'The Sparkly Trunk clicked open only after laughter, revealing treasures that changed every time.'
        ],
        fallbackColors: ['#9370DB', '#E6E6FA', '#FF69B4', '#8B4513', '#FFD700', '#2F4F4F', '#E0FFFF', '#FFD700', '#FF69B4', '#CD7F32'],
        sounds: { min: 500, max: 850 },
        size: 26
    },
    fairy: {
        name: '🧚 Fantasy',
        images: [
'https://cdn-icons-png.flaticon.com/128/327/327414.png',
'https://cdn-icons-png.flaticon.com/128/8282/8282891.png',
'https://cdn-icons-png.flaticon.com/128/4475/4475009.png',
'https://cdn-icons-png.flaticon.com/128/5169/5169305.png',
'https://cdn-icons-png.flaticon.com/128/4374/4374297.png',
'https://cdn-icons-png.flaticon.com/128/6024/6024708.png',
'https://cdn-icons-png.flaticon.com/128/4474/4474959.png',
'https://cdn-icons-png.flaticon.com/128/1680/1680412.png',
'https://cdn-icons-png.flaticon.com/128/477/477127.png',
'https://cdn-icons-png.flaticon.com/128/9084/9084839.png'
        ],
        itemNames: ['Castle', 'Ogre', 'Dragon', 'Phoenix', 'Knight', 'Three Headed Dragon', 'Fairy', 'Centaur', 'Ent', 'Elf'],
        itemDescriptions: [
            'On a hill of silver grass, the old Castle lit one window each night for travelers who were brave enough to follow starlight.',
            'The Ogre guarded a hidden bridge, demanding one joke from every traveler and laughing hardest at the worst ones.',
            'A young Dragon hoarded not gold, but lost songs, and sang them back to villages that had forgotten their own names.',
            'When the valley froze, the Phoenix rose in a spiral of dawn-fire and left spring flowers in the snow.',
            'The Knight carried a dented shield and a promise: no one in the kingdom would face the dark alone.',
            'The Three Headed Dragon argued constantly, but when danger came, all three roared in perfect harmony.',
            'A tiny Fairy stitched moonbeams into lanterns so children could dream safely through stormy nights.',
            'The Centaur mapped every forest path, guiding wanderers home before the fog could steal their way.',
            'The Ent woke only at sunset, speaking slowly enough that even the wind paused to listen.',
            'The Elf could hear secrets in river water and once saved a city by listening before anyone else.'
        ],
        fallbackColors: ['#FFB6C1', '#E6E6FA', '#FF6347', '#FF4500', '#F5F5F5', '#DAA520', '#20B2AA', '#FFD700', '#FFB6C1', '#8B4513'],
        sounds: { min: 450, max: 800 },
        size: 28
    },

    // PRECIOUS ITEMS
    hearts: {
        name: '💖 Hearts',
        images: [
'https://cdn-icons-png.flaticon.com/128/508/508735.png',
'https://cdn-icons-png.flaticon.com/128/3507/3507554.png',
'https://cdn-icons-png.flaticon.com/128/3769/3769084.png',
'https://cdn-icons-png.flaticon.com/128/4790/4790061.png',
'https://cdn-icons-png.flaticon.com/128/7521/7521915.png',
'https://cdn-icons-png.flaticon.com/128/10916/10916018.png',
'https://cdn-icons-png.flaticon.com/128/10832/10832488.png',
'https://cdn-icons-png.flaticon.com/128/2077/2077885.png',
'https://cdn-icons-png.flaticon.com/128/693/693388.png',
'https://cdn-icons-png.flaticon.com/128/6350/6350114.png'
        ],
        itemNames: ['Real Heart', 'Heart Letter', 'Teddy Heart', 'Heart Candies', 'Heart Shape', 'Rainbow Heart', 'Finger Hearts', 'Huggy Heart', 'Healing Heart', 'Arrowed Hearts'],
        itemDescriptions: [
            'A steady heartbeat that says I choose you, every day, in every way.',
            'A love letter folded with care, holding words too tender to say out loud.',
            'A soft teddy heart that keeps your warmth like a secret hug.',
            'Sweet little candies that taste like blushes and late-night smiles.',
            'A simple heart shape, timeless as first love and just as brave.',
            'A rainbow heart painted with every shade of loving you.',
            'Tiny finger hearts for quick reminders that you are always on my mind.',
            'A huggy heart that wraps around you when I cannot be there.',
            'A healing heart that mends quietly with patience, kindness, and love.',
            'Arrowed hearts that strike fast, because some loves are destiny on sight.'
        ],
        fallbackColors: ['#FF69B4', '#FF1493', '#9370DB', '#4169E1', '#FFD700', '#FF69B4', '#FFB6C1', '#E6E6FA', '#B0E0E6', '#FFC0CB'],
        sounds: { min: 300, max: 600 },
        size: 24
    },
    stars: {
        name: '⭐ Stars',
        images: [
'https://cdn-icons-png.flaticon.com/128/9274/9274178.png',
'https://cdn-icons-png.flaticon.com/128/6024/6024632.png',
'https://cdn-icons-png.flaticon.com/128/389/389203.png',
'https://cdn-icons-png.flaticon.com/128/12321/12321198.png',
'https://cdn-icons-png.flaticon.com/128/560/560921.png',
'https://cdn-icons-png.flaticon.com/128/6081/6081791.png',
'https://cdn-icons-png.flaticon.com/128/10403/10403449.png',
'https://cdn-icons-png.flaticon.com/128/1747/1747633.png',
'https://cdn-icons-png.flaticon.com/128/560/560896.png',
'https://cdn-icons-png.flaticon.com/128/2363/2363876.png'
        ],
        itemNames: ['Velora', 'Nyxion', 'Solari', 'Astrell', 'Lumora', 'Zentari', 'Orphiel', 'Caelix', 'Vireon', 'Death Star'],
        itemDescriptions: [
            'Velora glows with a soft golden pulse that feels calm and ancient.',
            'Nyxion twinkles with cheerful energy, like it is smiling across the night sky.',
            'Solari radiates steady warmth, a bright star that feels like a beacon for travelers.',
            'Astrell glows with sleepy blinks, drifting in and out like a drowsy nightlight.',
            'Lumora streaks with speedy pulses, always in sync like a perfect cosmic metronome.',
            'Zentari flickers in rhythmic bursts, almost like a heartbeat of light.',
            'Orphiel casts a pale shimmer that drifts like stardust in silence.',
            'Caelix beams with crisp clarity and a clean, icy glow.',
            'Vireon glints in vibrant waves, like starlight filtered through cobalt glass.',
            'Death Star looms with cold, engineered light and unmistakable menace.'
        ],
        fallbackColors: ['#FFD700', '#C0C0C0', '#CD853F', '#FFB6C1', '#87CEEB', '#FF69B4', '#FFFACD', '#FFD700', '#E6E6FA', '#F0F8FF'],
        sounds: { min: 600, max: 1000 },
        size: 24
    },
    gems: {
        name: '💎 Gems',
        images: [
'https://cdn-icons-png.flaticon.com/128/1391/1391346.png',
'https://cdn-icons-png.flaticon.com/128/6701/6701447.png',
'https://cdn-icons-png.flaticon.com/128/6845/6845867.png',
'https://cdn-icons-png.flaticon.com/128/2119/2119233.png',
'https://cdn-icons-png.flaticon.com/128/6419/6419767.png',
'https://cdn-icons-png.flaticon.com/128/2732/2732350.png',
'https://cdn-icons-png.flaticon.com/128/6956/6956910.png',
'https://cdn-icons-png.flaticon.com/128/6839/6839117.png',
'https://cdn-icons-png.flaticon.com/128/4333/4333962.png',
'https://cdn-icons-png.flaticon.com/128/2634/2634269.png'
        ],
        itemNames: ['Debbie', 'Randy', 'Tammy', 'Brenda', 'Cindy', 'Kevin', 'Lisa', 'Scott', 'Heather', 'Stacy'],
        itemDescriptions: [
            'Debbie flashes bright confidence whenever someone tells a dramatic story nearby.',
            'Randy hums softly at midnight like a tiny disco ball with secrets.',
            'Tammy shines in bright blue tones with crisp sparkle and playful energy.',
            'Brenda glows warm and steady, especially during questionable life decisions.',
            'Cindy flickers in zigzags like it is choreographing its own dance routine.',
            'Kevin is all about sturdy crystal strength, with solid facets and dependable sparkle.',
            'Lisa reflects bold tones and bright starbursts that look suspiciously like confetti.',
            'Scott gives off a cool shine that makes ordinary shelves look expensive.',
            'Heather twinkles in soft pulses like it is sending friendly coded messages.',
            'Stacy radiates bright sparkle and behaves like every day is prom night.'
        ],
        fallbackColors: ['#E0FFFF', '#FF6347', '#50C878', '#4169E1', '#9370DB', '#FFD700', '#F5F5F5', '#FFE4E1', '#90EE90', '#FFD700'],
        sounds: { min: 500, max: 900 },
        size: 24
    },
    // FUN STUFF
    music: {
        name: '🎵 Music',
        images: [
'https://cdn-icons-png.flaticon.com/128/17482/17482216.png',
'https://cdn-icons-png.flaticon.com/128/2972/2972066.png',
'https://cdn-icons-png.flaticon.com/128/2669/2669529.png',
'https://cdn-icons-png.flaticon.com/128/14661/14661246.png',
'https://cdn-icons-png.flaticon.com/128/7460/7460400.png',
'https://cdn-icons-png.flaticon.com/128/5904/5904517.png',
'https://cdn-icons-png.flaticon.com/128/3274/3274258.png',
'https://cdn-icons-png.flaticon.com/128/7831/7831766.png',
'https://cdn-icons-png.flaticon.com/128/11040/11040931.png',
'https://cdn-icons-png.flaticon.com/128/2353/2353262.png'
        ],
        itemNames: ['Choir', 'Drums', 'eMusic', 'Controller', 'Piano', 'Rapper', 'Xylophone', 'Staff', 'Ukulele', 'Headphones'],
        itemDescriptions: [
            'Choir is tied to choral and gospel music, built on layered vocal harmonies.',
            'Drums drive rock, funk, and Afrobeat with rhythm-focused energy.',
            'eMusic is associated with electronic styles like EDM, house, and synthwave.',
            'Controller fits DJ and live electronic performance, where tracks are mixed in real time.',
            'Piano connects to classical, jazz, ballads, and cinematic scores.',
            'Rapper is rooted in hip-hop, with rhythmic vocals and beat-based storytelling.',
            'Xylophone is linked to bright orchestral passages, classroom rhythm, and world percussion.',
            'Staff represents written music across classical, film scoring, and formal composition.',
            'Ukulele is tied to island, folk-pop, and relaxed acoustic singalong styles.',
            'Headphones match lo-fi, personal playlists, and immersive studio listening.'
        ],
        fallbackColors: ['#FF69B4', '#4169E1', '#D2691E', '#2F2F2F', '#C0C0C0', '#8B4513', '#8B0000', '#FFD700', '#000000', '#708090'],
        sounds: { min: 400, max: 800 },
        size: 24
    }
};

// Calculate total collectibles count
function getTotalCollectiblesCount() {
    return Object.values(collectibles).reduce((sum, cat) =>
        sum + (cat.isMarble ? (cat.fallbackColors?.length || 0) : (cat.images?.length || 0)), 0);
}

// Get description or story for a collectible (used in collection detail popup)
function getItemDescription(categoryKey, index, itemName) {
    const category = collectibles[categoryKey];
    if (!category) return '';
    const custom = category.itemDescriptions?.[index];
    if (custom) return custom;
    return `A wonderful ${itemName} to add to your growing collection! Earned one habit at a time.`;
}
