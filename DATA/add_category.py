import pandas as pd
import re
import os

CATEGORIES = [
    "Electronics", "Smartphones & Accessories", "Computers & Laptops",
    "Audio & Headphones", "Cameras & Photography", "Gaming",
    "Men's Clothing", "Women's Clothing", "Shoes & Footwear",
    "Bags & Luggage", "Jewelry & Watches", "Beauty & Personal Care",
    "Home & Kitchen", "Furniture & Decor", "Lighting",
    "Sports & Outdoors", "Fitness & Gym", "Toys & Games",
    "Baby & Kids", "Pet Supplies", "Health & Wellness",
    "Automotive", "Tools & Hardware", "Office Supplies",
    "Books & Stationery", "Food & Beverages", "Garden & Outdoor Living",
    "Musical Instruments", "Art & Crafts", "Other"
]

INPUT_CSV = "ecommerce_dataset.csv"
OUTPUT_CSV = "ecommerce_dataset.csv"

# Keywords mapped to categories, checked in order (first match wins)
# More specific rules go first to avoid wrong matches
KEYWORD_RULES = [
    # Smartphones & Accessories
    ("Smartphones & Accessories", [
        r'\bphone\s*case\b', r'\bscreen\s*protector\b', r'\bphone\s*mount\b',
        r'\bphone\s*stand\b', r'\bphone\s*holder\b', r'\bcharger\b', r'\bcharging\b',
        r'\busb[\s-]c\b', r'\blightning\b', r'\bpower\s*bank\b', r'\bphone\s*grip\b',
        r'\bairpod\b', r'\bearbuds?\b(?!.*gaming)', r'\bcell\s*phone\b', r'\bsmartphone\b',
        r'\biphone\b', r'\bsamsung\s*galaxy\b', r'\bsim\s*card\b', r'\bphone\s*cable\b',
        r'\bwireless\s*charger\b', r'\bcar\s*mount.*phone\b', r'\btablet\s*case\b',
        r'\bipad\s*case\b', r'\bfor\s*(iphone|samsung|pixel|galaxy|ipad)\b',
        r'\bhonor\s*(x|magic|[0-9])', r'\boppo\s*(a|reno|find|f)',
        r'\brealme\s*(gt|c|narzo|[0-9])', r'\bxiaomi\b', r'\bvivo\b(?!.*vivo\s*barefoot)',
        r'\bredmi\b', r'\bfunda\b.*\b(telefono|celular|movil|phone)\b',
    ]),
    # Computers & Laptops
    ("Computers & Laptops", [
        r'\blaptop\b', r'\bnotebook\b(?!.*paper)', r'\bkeyboard\b', r'\bmouse\s*pad\b',
        r'\bcomputer\b', r'\bmonitor\b(?!.*baby)', r'\bdesktop\b', r'\bpc\s*gaming\b',
        r'\bram\s*\d+gb\b', r'\bssd\b', r'\bhard\s*drive\b', r'\bmotherboard\b',
        r'\bgraphics\s*card\b', r'\bgpu\b', r'\bcpu\b', r'\bprocessor\b',
        r'\bprinter\b', r'\bink\s*cartridge\b', r'\btoner\b', r'\brouter\b',
        r'\bwifi\b(?!.*bulb)', r'\bethernet\b', r'\bhdmi\b', r'\busb\s*hub\b',
        r'\bwebcam\b', r'\bmouse\b(?!.*trap)', r'\bflash\s*drive\b',
    ]),
    # Audio & Headphones
    ("Audio & Headphones", [
        r'\bheadphone\b', r'\bheadset\b', r'\bspeaker\b(?!.*shelf)',
        r'\bsoundbar\b', r'\bamplifier\b', r'\bsubwoofer\b',
        r'\bbluetooth\s*speaker\b', r'\bearphone\b', r'\baudio\b',
        r'\bmicrophone\b', r'\bmic\b(?!.*ro)', r'\bheadband.*ear\b',
        r'\bnoise\s*cancel', r'\bear\s*tip\b', r'\bear\s*pad\b', r'\bear\s*cushion\b',
    ]),
    # Cameras & Photography
    ("Cameras & Photography", [
        r'\bcamera\b(?!.*dash)', r'\bdslr\b', r'\bmirrorless\b', r'\blens\s*filter\b',
        r'\btripod\b', r'\bphotograph', r'\bcamera\s*lens\b', r'\bringlight\b',
        r'\bring\s*light\b', r'\bselfie\b', r'\bgimbal\b', r'\baction\s*cam\b',
        r'\bgopro\b', r'\bdrone\b', r'\bbinocular\b', r'\btelescope\b',
        r'\bmemory\s*card\b', r'\bsd\s*card\b', r'\bcamera\s*bag\b',
    ]),
    # Gaming
    ("Gaming", [
        r'\bgaming\b', r'\bplaystation\b', r'\bxbox\b', r'\bnintendo\b',
        r'\bcontroller\b(?!.*shower|.*sprinkler)', r'\bgamepad\b', r'\bjoystick\b',
        r'\bconsole\b(?!.*table)', r'\bvideo\s*game\b', r'\bps[45]\b', r'\bgame\s*pad\b',
    ]),
    # Baby & Kids  (before clothing to catch kids items)
    ("Baby & Kids", [
        r'\bbaby\b', r'\binfant\b', r'\bnewborn\b', r'\btoddler\b',
        r'\bstroller\b', r'\bpacifier\b', r'\bnursing\b', r'\bdiaper\b',
        r'\bbaby\s*monitor\b', r'\bcar\s*seat.*child\b', r'\bbib\b(?!.*overalls)',
        r'\bmaternity\b', r'\bteether\b', r'\bbaby\s*bottle\b',
        r'\bkids?\s*swim\b', r'\bchildren\b',
    ]),
    # Men's Clothing
    ("Men's Clothing", [
        r"\bmen'?s\s*(shirt|polo|jacket|coat|pant|jean|short|suit|blazer|vest|hoodie|sweater|tee|t-shirt|underwear|sock|boxer|brief|trunk|robe|pajama)",
        r'\b(shirt|polo|jacket|coat|blazer|hoodie|sweater)\b.*\bmen\b',
        r'\bmen\b.*\b(shirt|polo|jacket|coat|blazer|hoodie|sweater)\b',
        r"\bmen'?s\s*(clothing|apparel|wear|outfit|fashion)\b",
        r'\btie\b(?!.*down|.*rod|.*wire|.*strap|.*cable|.*wrap|.*dye)',
        r'\bcufflink\b', r'\bsuspender\b',
        r'\bhombres?\b.*\b(camiseta|camisa|pantalones|chaqueta|sudadera|polera|maillot|ropa|jersey)\b',
        r'\b(camiseta|camisa|pantalones|chaqueta|sudadera|polera|ropa)\b.*\bhombres?\b',
        r'\bmen\b.*\b(flannel|lounge|sleep|pajama)\b',
        r'\bboys?\b.*\b(tee|shirt|tank|pant|short)\b',
    ]),
    # Women's Clothing
    ("Women's Clothing", [
        r"\bwomen'?s\s*(dress|blouse|skirt|legging|pant|jean|shirt|top|jacket|coat|sweater|hoodie|cardigan|tunic|tank\s*top|bra|panties?|underwear|lingerie|robe|pajama|nightgown)",
        r'\b(dress|blouse|skirt|legging|tunic|cardigan|lingerie|nightgown|bikini)\b(?!.*shoe)(?!.*table)',
        r"\bwomen'?s\s*(clothing|apparel|wear|outfit|fashion)\b",
        r'\byoga\s*(pant|legging)\b', r'\bswim\s*suit\b', r'\bswimwear\b',
        r'\bbathing\s*suit\b', r'\bsarong\b', r'\bcamisole\b',
        r'\bnipple\s*past', r'\bpastie\b',
        r'\bmujeres?\b.*\b(vestido|falda|blusa|camiseta|pantalones|ropa|polera|maillot)\b',
        r'\b(vestido|falda|blusa)\b.*\bmujeres?\b',
        r'\bwomen\b.*\b(bra|panty|underwire|support|curvy|bootcut|luscious)\b',
        r'\b(romwe|shein)\b.*\b(fair|boho|style|charm)\b',
        r'\bvanity\s*fair\b', r'\bgoddess\b.*\bbra\b',
        r'\bbawal\b', r'\bshawl\b', r'\bhijab\b', r'\bkerudung\b',
        r'\bgirls?\b.*\b(shirt|tee|top|pant|short|dress|skirt)\b',
    ]),
    # Shoes & Footwear
    ("Shoes & Footwear", [
        r'\bshoe\b', r'\bsneaker\b', r'\bboot\b(?!.*car|.*trunk|.*computer)',
        r'\bsandal\b', r'\bslipper\b', r'\bflip\s*flop\b', r'\bloafer\b',
        r'\bpump\b(?!.*water|.*air|.*fuel|.*soap)', r'\bheel\b(?!.*pain)',
        r'\bfootwear\b', r'\binsole\b', r'\bmoccasin\b', r'\bbootie\b',
        r'\brunning\s*shoe\b', r'\bcleat\b', r'\bfin\b(?!.*ger|.*ish|.*e\b|.*d\b|.*al)',
        r'\bswim\s*fin\b',
    ]),
    # Bags & Luggage
    ("Bags & Luggage", [
        r'\bbackpack\b', r'\bluggage\b', r'\bsuitcase\b', r'\bduffel\b',
        r'\btote\s*bag\b', r'\bhandbag\b', r'\bpurse\b', r'\bwallet\b',
        r'\bcrossbody\b', r'\bmessenger\s*bag\b', r'\btravel\s*bag\b',
        r'\bfanny\s*pack\b', r'\bwaist\s*bag\b', r'\bcosmetic\s*bag\b',
        r'\btoiletry\s*bag\b', r'\blaptop\s*bag\b', r'\bbriefcase\b',
        r'\bdiaper\s*bag\b', r'\bcooler\s*bag\b',
        r'\bkoper\b', r'\bhandel\b.*\bkoper\b', r'\btas\b.*\b(koper|anak|ransel)\b',
        r'\bbolsa\b.*\bcasco\b',
    ]),
    # Jewelry & Watches
    ("Jewelry & Watches", [
        r'\bnecklace\b', r'\bbracelet\b', r'\bearring\b', r'\bring\b(?!.*light|.*binder|.*door)',
        r'\bjewelry\b', r'\bjewellery\b', r'\bwatch\b(?!.*dog|.*tower)',
        r'\bpendant\b', r'\bbrooch\b', r'\banklet\b', r'\bchain\b(?!.*saw|.*link\s*fence)',
        r'\bgold\s*(necklace|bracelet|earring|ring|chain)\b',
        r'\bsilver\s*(necklace|bracelet|earring|ring|chain)\b',
        r'\bextender\b.*\b(necklace|bracelet|chain)\b',
        r'\bscarf\s*clip\b', r'\bscarf\s*pin\b', r'\bclip\b.*\bscarf\b',
    ]),
    # Beauty & Personal Care
    ("Beauty & Personal Care", [
        r'\bmakeup\b', r'\bcosmetic\b(?!.*bag)', r'\bfoundation\b(?!.*repair)',
        r'\blipstick\b', r'\bmascara\b', r'\beyeshadow\b', r'\bblush\b(?!.*wine)',
        r'\bconcealer\b', r'\bnail\s*polish\b', r'\bperfume\b', r'\bcologne\b',
        r'\bskincare\b', r'\bskin\s*care\b', r'\bmoisturiz', r'\bserum\b',
        r'\bsunscreen\b', r'\bshampoo\b', r'\bconditioner\b(?!.*air)',
        r'\bbody\s*(wash|lotion|cream|oil|butter)\b', r'\bdeodorant\b',
        r'\bfragrance\b', r'\bepilat', r'\bhair\s*(dryer|straightener|curler|iron|clip|tie|oil|growth|brush|comb|removal|color|dye)',
        r'\bbeard\b', r'\brazor\b', r'\bshaving\b', r'\bface\s*(wash|cream|mask|cleanser|scrub)\b',
        r'\bbath\s*bomb\b', r'\bsoap\b(?!.*dish|.*dispenser)', r'\blotion\b',
        r'\bcream\b(?!.*ice|.*whip|.*cheese)', r'\btooth(brush|paste)\b',
        r'\boral\s*(care|hygiene|b)\b', r'\bbrush\b(?!.*paint|.*grill).*\bhair\b',
        r'\bwig\b', r'\bwigs\b', r'\bsynthetic\s*(hair|wig|ombre)',
        r'\bponytail\b.*\b(hair|extension|drawstring)\b',
        r'\bhair\s*(bun|chignon|extension|piece|weave|braid|ponytail|weft)\b',
        r'\blace\s*wig\b', r'\bwig\s*tape\b', r'\bfalse\s*nail\b',
        r'\bnail\s*art\b', r'\bfalse\s*eyelash\b', r'\beye\s*brush\b',
        r'\bbeauty\s*egg\b', r'\bpuff\b.*\bhair\b',
        r'\beau\s*de\s*(toilette|parfum)\b', r'\btom\s*ford\b.*\b(perfume|spray|toilette|briefs?)\b',
        r'\bhermes\b.*\b(eau|toilette|parfum)\b',
        r'\bminoxidil\b', r'\bcrecimiento.*cabell\b',
        r'\bs.a\s*r.a\s*m.t\b', r'\bn..c\s*(gi.t|r.a)\b',
        r'\bsabun\b', r'\bsữa\s*rửa\b',
    ]),
    # Pet Supplies
    ("Pet Supplies", [
        r'\bdog\b(?!.*hot)', r'\bcat\b(?!.*alog|.*egory|.*ch|.*hedral|.*erpillar)',
        r'\bpet\b(?!.*al|.*rol)', r'\bpuppy\b', r'\bkitten\b',
        r'\bflea\b', r'\btick\b(?!.*et|.*ing)', r'\baquarium\b', r'\bfish\s*tank\b',
        r'\bbird\s*(cage|feeder|seed|house|bath)\b', r'\bhamster\b',
        r'\bcatnip\b', r'\bdog\s*(bed|leash|collar|bowl|treat|food|toy|crate|harness)\b',
        r'\bcat\s*(bed|litter|tree|tower|toy|food|treat|scratcher)\b',
        r'\bpet\s*(bed|bowl|carrier|food|treat|toy)\b',
        r'\bcollars?\b.*\b(dog|cat|pet|flea)\b',
    ]),
    # Fitness & Gym
    ("Fitness & Gym", [
        r'\bdumbbell\b', r'\bbarbell\b', r'\bkettle\s*bell\b', r'\bweight\s*(set|plate|bench|rack)\b',
        r'\bresistance\s*band\b', r'\byoga\s*mat\b', r'\bexercise\b',
        r'\bfitness\b', r'\bgym\b', r'\bworkout\b(?!.*shirt|.*top|.*pant)',
        r'\btreadmill\b', r'\belliptical\b', r'\bjump\s*rope\b',
        r'\bpull[\s-]*up\s*bar\b', r'\bfoam\s*roller\b', r'\bab\s*(roller|wheel)\b',
    ]),
    # Sports & Outdoors
    ("Sports & Outdoors", [
        r'\bbaseball\b', r'\bbasketball\b', r'\bfootball\b', r'\bsoccer\b',
        r'\btennis\b', r'\bgolf\b', r'\bbadminton\b', r'\bvolleyball\b',
        r'\bhiking\b', r'\bcamping\b', r'\btent\b(?!.*intent)', r'\bsleeping\s*bag\b',
        r'\bcooler\b(?!.*bag)', r'\bfishing\b', r'\bhunting\b', r'\bkayak\b',
        r'\bswim\b(?!.*suit|.*wear|.*fin)', r'\bpool\b(?!.*table)',
        r'\bbicycle\b', r'\bbike\b(?!.*r)', r'\bcycling\b', r'\bhelmet\b(?!.*hard\s*hat)',
        r'\bsport\b', r'\boutdoor\b(?!.*light|.*furniture)',
        r'\bscooter\b', r'\bskateboard\b', r'\bsnowboard\b', r'\bski\b',
        r'\bmotorcycle\b(?!.*oil)', r'\bcruiser\b',
        r'\bciclismo\b', r'\bmaillot\b', r'\bbicicleta\b', r'\bbasikal\b',
        r'\bmotocross\b', r'\benduro\b', r'\bbmx\b', r'\bfxr\b',
        r'\bstrava\b', r'\bfly\s*racing\b', r'\bleatt\b',
        r'\bcasco\b.*\b(moto|ciclismo|biciclet|carreras)\b',
        r'\bcasco\b.*\b(pegatina|reflectante)\b',
        r'\bproteccion\s*solar\b.*\bcamisa\b',
        r'\bjersey\b.*\b(ciclismo|cycling|motocross|racing|bicicleta|triathlon|triatl)\b',
        r'\b(polera|conjunto)\b.*\bciclismo\b',
        r'\bf.tbol\b.*\b(camiseta|retro)\b',
        r'\bzumba\b',
    ]),
    # Toys & Games
    ("Toys & Games", [
        r'\btoy\b', r'\bpuzzle\b', r'\blego\b', r'\baction\s*figure\b',
        r'\bboard\s*game\b', r'\bcard\s*game\b', r'\bstuffed\s*animal\b',
        r'\bplush\b', r'\bdoll\b(?!.*ar)', r'\bnerf\b', r'\brc\s*car\b',
        r'\bremote\s*control\b(?!.*light)', r'\bplay\s*(set|house|mat|dough)\b',
        r'\bbuilding\s*block\b', r'\bteddy\b', r'\bfigure\b(?!.*out)',
        r'\bbean\s*bag\b(?!.*chair)',
        r'\bgundam\b', r'\bbandai\b', r'\bmg\s*1/100\b', r'\bhg\s*(1/144|gundam)\b',
        r'\bsylvanian\b', r'\baquabeads\b',
        r'\bjuguete\b', r'\bmu.eco\b',
    ]),
    # Health & Wellness
    ("Health & Wellness", [
        r'\bvitamin\b', r'\bsupplement\b', r'\bcapsule\b(?!.*coffee)',
        r'\bprobiotic\b', r'\bprotein\s*(powder|shake)\b', r'\bfirst\s*aid\b',
        r'\bthermometer\b', r'\bblood\s*pressure\b', r'\bmassag', r'\bpain\s*relief\b',
        r'\bhealth\b(?!.*y)', r'\bwellness\b', r'\bherbal\b', r'\bimmun',
        r'\bdigest', r'\bmelatonin\b', r'\bechinacea\b', r'\bglandular\b',
        r'\bextract\b.*\b(herb|root|leaf|plant|natural|echinacea|ginger)\b',
        r'\bmedic(al|ine|ation)\b', r'\bbandage\b', r'\binhaler\b',
        r'\bessential\s*oil\b',
    ]),
    # Automotive
    ("Automotive", [
        r'\bcar\b(?!.*d\s*game|.*pet|.*go|.*ousel|.*ibbean)', r'\bvehicle\b',
        r'\btire\b(?!.*d\b)', r'\bautomotive\b', r'\bengine\b(?!.*ering)',
        r'\bdash\s*cam\b', r'\bwiper\b', r'\bfloor\s*mat\b', r'\bcar\s*seat\b(?!.*child)',
        r'\bsteering\b', r'\btaillight\b', r'\bheadlight\b', r'\bbumper\b(?!.*sticker)',
        r'\bfuel\b', r'\bmotor\s*oil\b', r'\bbrake\b', r'\bwheel\b(?!.*chair)',
        r'\bbattery\b(?!.*phone|.*laptop|.*drill|.*tool|.*aaa|.*aa\b)',
        r'\banti\s*freeze\b', r'\bcoolant\b', r'\bwax\b.*\bcar\b',
        r'\bdeicing\b', r'\bgutter\b(?!.*garden)', r'\bbungee\b',
        r'\btire\s*pressure\b', r'\bmotorcycle\s*(tire|oil|helmet|glove)\b',
        r'\bunderglow\b',
        r'\bknalpot\b', r'\broda\b.*\bkoper\b',
    ]),
    # Tools & Hardware
    ("Tools & Hardware", [
        r'\bwrench\b', r'\bscrewdriver\b', r'\bdrill\b(?!.*sergeant)',
        r'\bhammer\b', r'\bplier\b', r'\bsaw\b(?!.*dust)', r'\bsocket\b(?!.*electric)',
        r'\btool\s*(set|kit|box|bag|belt|chest)\b', r'\butility\s*knife\b',
        r'\bmeasuring\s*tape\b', r'\blevel\b(?!.*up)', r'\bclamp\b',
        r'\bsolder\b', r'\btape\s*measure\b', r'\bnail\b(?!.*polish|.*art|.*file)',
        r'\bscrew\b(?!.*driver)', r'\bbolt\b(?!.*action)', r'\bnut\b(?!.*rition|.*butter)',
        r'\bauger\b', r'\bcordless\b.*\b(drill|tool|saw)\b',
        r'\bhardware\b', r'\bflashlight\b', r'\bheadlamp\b(?!.*car)',
        r'\btool\b(?!.*th)', r'\bcleaner\b(?!.*face|.*skin)',
        r'\bvise[\s-]*grip\b', r'\birwin\b', r'\blocking\s*plier\b',
        r'\bspade\b(?!.*card)', r'\btransplant\s*spade\b',
    ]),
    # Office Supplies
    ("Office Supplies", [
        r'\bstapler\b', r'\bpaper\s*clip\b', r'\bbinder\b', r'\bfolder\b',
        r'\benvelope\b', r'\bsticky\s*note\b', r'\bwhiteboard\b',
        r'\boffice\b', r'\bdesk\s*(organizer|pad|lamp|mat)\b', r'\bfile\s*cabinet\b',
        r'\blabel\s*maker\b', r'\bshredder\b', r'\bcalculator\b',
        r'\bstaple\b', r'\btissue\b(?!.*paper)', r'\btoilet\s*paper\b',
        r'\bpaper\s*towel\b', r'\bbathroom\b.*\b(tissue|paper)\b',
        r'\btape\s*logic\b', r'\bmasking\s*tape\b', r'\bpacking\s*list\b',
    ]),
    # Books & Stationery
    ("Books & Stationery", [
        r'\bbook\b(?!.*case|.*shelf|.*end|.*mark)', r'\bnovel\b', r'\btextbook\b',
        r'\bjournal\b(?!.*bearing)', r'\bnotebook\b.*\b(paper|ruled|lined)\b',
        r'\bplanner\b', r'\bcalendar\b', r'\bdiary\b', r'\bpen\b(?!.*cil|.*dant|.*ny)',
        r'\bpencil\b', r'\bmarker\b(?!.*cone)', r'\bhighlighter\b',
        r'\bcrayon\b', r'\bcoloring\b', r'\bsticker\b(?!.*bumper)',
        r'\bstationer', r'\bnotebook\b.*paper\b',
        r'\blabel\b.*\b(laser|avery|mailing|sheet)\b',
    ]),
    # Food & Beverages
    ("Food & Beverages", [
        r'\bchocolate\b', r'\bcandy\b', r'\bsnack\b', r'\bcoffee\b',
        r'\btea\b(?!.*ch|.*m|.*r)', r'\bcereal\b', r'\bcookie\b',
        r'\bsauce\b', r'\bspice\b', r'\bseasoning\b', r'\bnut\s*butter\b',
        r'\balmond\s*butter\b', r'\bpeanut\s*butter\b', r'\bprotein\s*bar\b',
        r'\bfood\b(?!.*processor|.*storage|.*container|.*grade)',
        r'\bbeverage\b', r'\bdrink\b(?!.*ing)', r'\bjuice\b', r'\bwater\b(?!.*proof|.*resistant|.*fall|.*hose)',
        r'\bsugar\b(?!.*free)', r'\bhoney\b(?!.*comb)', r'\bsyrup\b',
        r'\bbeer\b(?!.*pong)', r'\bwine\b(?!.*rack)', r'\bwhiskey\b', r'\bvodka\b',
        r'\bperoni\b', r'\bnastro\b',
        r'\bmie\s*lidi\b', r'\bmakanan\b', r'\bminuman\b',
        r'\bn..c\s*(gi.t|detergent)\b',
    ]),
    # Furniture & Decor
    ("Furniture & Decor", [
        r'\bsofa\b', r'\bcouch\b', r'\bchair\b(?!.*wheel|.*man)', r'\btable\b(?!.*cloth|.*top.*game)',
        r'\bdesk\b(?!.*organizer|.*pad|.*lamp|.*mat)', r'\bbookshelf\b', r'\bshelf\b',
        r'\bcurtain\b', r'\brug\b(?!.*by|.*ged)', r'\bcarpet\b', r'\bmattress\b',
        r'\bpillow\b(?!.*case)', r'\bcushion\b(?!.*ear)', r'\bblanket\b',
        r'\bbedding\b', r'\bduvet\b', r'\bcomforter\b', r'\bsheet\s*set\b',
        r'\bfurniture\b', r'\bdecor\b', r'\bwall\s*(art|decal|sticker|clock|mount|shelf|panel)\b',
        r'\bacoustic\s*panel\b', r'\bwood\s*slat\b', r'\bmirror\b(?!.*less)',
        r'\bvase\b', r'\bframe\b(?!.*work)', r'\bcandle\b(?!.*holder)',
        r'\bwreath\b', r'\bdoor\s*(sign|mat|decor|wreath)\b',
        r'\bbean\s*bag\s*chair\b',
    ]),
    # Lighting
    ("Lighting", [
        r'\bled\s*bulb\b', r'\blight\s*bulb\b', r'\blamp\b(?!.*oon)',
        r'\bchandelier\b', r'\bsconce\b', r'\bflood\s*light\b',
        r'\bstring\s*light\b', r'\bled\s*strip\b', r'\bled\s*light\b',
        r'\bsolar\s*(light|post|lamp|lantern)\b', r'\bnight\s*light\b',
        r'\bceiling\s*(light|fan|lamp)\b', r'\bpendant\s*light\b',
        r'\bfence\s*(light|post)\b', r'\bspot\s*light\b', r'\bhalogen\b',
        r'\blighting\b',
    ]),
    # Home & Kitchen
    ("Home & Kitchen", [
        r'\bkitchen\b', r'\bcookware\b', r'\bbakeware\b', r'\bfrying\s*pan\b',
        r'\bpot\b(?!.*ato|.*ion|.*ting)', r'\bblender\b', r'\bmixer\b(?!.*audio|.*sound)',
        r'\btoaster\b', r'\bcoffee\s*maker\b', r'\bdishwasher\b',
        r'\bcutting\s*board\b', r'\bknife\s*set\b', r'\bplate\b(?!.*armor|.*wall)',
        r'\bcup\b(?!.*board)', r'\bmug\b', r'\bglass\b(?!.*es\b)',
        r'\btowel\b(?!.*paper)', r'\bhanger\b', r'\bcontainer\b', r'\bstorage\b',
        r'\borganiz', r'\bcleaning\b', r'\bvacuum\b', r'\bmop\b', r'\bbroom\b',
        r'\btrash\s*can\b', r'\blaundry\b', r'\biron\b(?!.*ing\s*board|.*man)',
        r'\bsteam\b(?!.*er\s*game)', r'\bappliance\b', r'\bhome\b(?!.*page)',
        r'\bplastic\s*plate\b', r'\bdisposable\s*plate\b', r'\brestroom\b',
        r'\bespresso\b', r'\bcleaner\b', r'\bresin\s*step\b',
        r'\bsewing\b', r'\bcraft\s*organiz',
        r'\bwaffle\s*maker\b', r'\bnapkin\b', r'\btablecloth\b',
        r'\bteaspoon\b', r'\bspoon\b', r'\bfork\b(?!.*lift)',
        r'\bshower\s*drain\b', r'\bgable\s*vent\b', r'\blouver\b',
        r'\btumbler\b', r'\bbotella\b', r'\btaza\b',
        r'\btoilet\s*seat\b', r'\bdetergent\b',
        r'\bsprei\b', r'\bserokan\b',
        r'\bumbrella\b',
    ]),
    # Garden & Outdoor Living
    ("Garden & Outdoor Living", [
        r'\bgarden\b', r'\bplant\b(?!.*ar|.*ation)', r'\bflower\s*pot\b',
        r'\bplanter\b', r'\blawn\b', r'\bmower\b', r'\bsprinkler\b',
        r'\bhose\b(?!.*iery)', r'\bpatio\b', r'\boutdoor\s*(furniture|chair|table|rug|cushion)\b',
        r'\bbarbecue\b', r'\bbbq\b', r'\bgrill\b(?!.*cheese)',
        r'\bgreenhouse\b', r'\bfertilizer\b', r'\bseed\b(?!.*ing)',
        r'\btrellis\b', r'\bobelisk\b.*plant\b', r'\bfire\s*pit\b',
        r'\bpool\s*(cleaner|cover|float|chemical|chlorine)\b',
    ]),
    # Musical Instruments
    ("Musical Instruments", [
        r'\bguitar\b', r'\bpiano\b', r'\bkeyboard\b(?!.*computer|.*gaming)',
        r'\bdrum\b', r'\bviolin\b', r'\bukulele\b', r'\bflute\b',
        r'\btrumpet\b', r'\bsaxophone\b', r'\bharmonica\b',
        r'\bcapo\b', r'\bguitar\s*(string|pick|tuner|strap|stand)\b',
        r'\binstrument\b(?!.*surgical|.*medical)',
        r'\bdrumhead\b', r'\bremo\b.*\b(drum|tom|snare|batter)\b',
    ]),
    # Art & Crafts
    ("Art & Crafts", [
        r'\bpaint\b(?!.*er\s*tape)', r'\bwatercolor\b', r'\bacrylic\s*paint\b',
        r'\bcanvas\b', r'\beasel\b', r'\bsketchbook\b', r'\bdrawing\b',
        r'\bcrafts?\b(?!.*organiz|.*beer)', r'\bknitting\b', r'\bcrochet\b',
        r'\byarn\b', r'\bembroidery\b', r'\bscrapbook\b', r'\bstamp\b(?!.*ede)',
        r'\bglue\s*gun\b', r'\bribbon\b', r'\bbead\b', r'\bclay\b(?!.*more)',
        r'\bresin\b(?!.*step)',
        r'\bposter\s*print\b', r'\bvan\s*gogh\b',
    ]),
    # Broad clothing catch-all (multilingual) - after specific men's/women's 
    ("Women's Clothing", [
        r'\b(ropa|camiseta|camisa|polera|pantalones|chaqueta|sudadera)\\b.*\b(mujer|femenin|dama)\b',
        r'\bvestido\b', r'\bfalda\b', r'\bblusa\b',
        r'\bbaju\b(?!.*anak)', r'\bkemeja\b', r'\bcelana\b',
        r'\bkaos\b', r'\bheadband\b', r'\bscarf\b',
        r'\bwomen\b.*\b(shirt|top|pant|jean|short|tank|tee)\b',
        r'\bsexy\b.*\b(dress|top|lingerie|costume)\b',
        r'\b(romwe|shein)\b',
    ]),
    ("Men's Clothing", [
        r'\b(ropa|camiseta|camisa|polera|pantalones|chaqueta|sudadera)\b(?!.*mujer|.*femenin|.*dama)',
        r'\bpajama\s*pant\b', r'\bpajamas?\b',
        r'\bflannel\b.*\bpant\b',
    ]),
    # Electronics (broad catch-all for electronics)
    ("Electronics", [
        r'\bbattery\b', r'\bled\b', r'\bsmart\s*(home|plug|switch|thermostat|display)\b',
        r'\bremote\b(?!.*control.*toy)', r'\bcable\b(?!.*knit)',
        r'\badapter\b', r'\bconverter\b', r'\bextension\s*cord\b',
        r'\bpower\s*strip\b', r'\bsurge\s*protector\b', r'\btimer\b',
        r'\bthermometer\b(?!.*medical)', r'\bscale\b(?!.*fish)',
        r'\belectronic\b', r'\bdigital\b(?!.*print)', r'\bsensor\b',
        r'\bsecurity\s*camera\b', r'\balarm\b', r'\bdetector\b',
        r'\bsmart\s*watch\b', r'\bfitbit\b', r'\bfitness\s*tracker\b',
        r'\bprojector\b', r'\bvr\b', r'\bstreaming\b',
    ]),
]

def classify_product(name, description):
    text = str(name).lower()
    if pd.notna(description):
        text += " " + str(description).lower()

    for category, patterns in KEYWORD_RULES:
        for pattern in patterns:
            if re.search(pattern, text):
                return category
    return "Other"

def main():
    df = pd.read_csv(INPUT_CSV)
    total = len(df)
    print(f"Classifying {total} products using keyword rules...")

    df['category'] = df.apply(
        lambda row: classify_product(row['product_name'], row['description']),
        axis=1
    )

    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Done! Saved to {OUTPUT_CSV}")

    # Show category distribution
    print("\nCategory distribution:")
    print(df['category'].value_counts().to_string())

    other_count = (df['category'] == 'Other').sum()
    print(f"\nOther: {other_count}/{total} ({other_count*100//total}%)")

if __name__ == "__main__":
    main()
