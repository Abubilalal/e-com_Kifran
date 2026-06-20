<?php
require 'config.php';

// Your existing seed data from kifran-data.js
$seed = [
    ['id'=>'p1','name'=>'Canega Walking Cane','brand'=>'KIFRAN Heritage','material'=>'Solid Sheesham','cat'=>'Canes','price'=>6800,'mrp'=>11000,'stock'=>8,'badge'=>'Bestseller','rating'=>4.9,'reviews'=>214,'colors'=>['Natural','Walnut'],'sizes'=>['34"','36"','38"'],'img'=>'images/opt/cane-md.jpg'],
    ['id'=>'p2','name'=>'Classic Walking Stick','brand'=>'KIFRAN Heritage','material'=>'Teak Wood','cat'=>'Canes','price'=>4200,'mrp'=>5500,'stock'=>12,'badge'=>'','rating'=>4.7,'reviews'=>138,'colors'=>['Natural','Honey'],'sizes'=>['34"','36"','38"'],'img'=>'images/opt/stick1-md.jpg'],
    ['id'=>'p3','name'=>'Heritage Walking Stick','brand'=>'KIFRAN Atelier','material'=>'Walnut Wood','cat'=>'Wellbeing','price'=>3800,'mrp'=>4900,'stock'=>4,'badge'=>'Limited','rating'=>4.8,'reviews'=>96,'colors'=>['Walnut','Ebony'],'sizes'=>['36"','38"'],'img'=>'images/opt/stick2-md.jpg'],
    ['id'=>'p4','name'=>'Wooden Crochet Hook','brand'=>'KIFRAN Studio','material'=>'Rosewood','cat'=>'Yarn Tools','price'=>650,'mrp'=>0,'stock'=>30,'badge'=>'New','rating'=>4.9,'reviews'=>402,'colors'=>['Natural','Honey'],'sizes'=>['3 mm','4 mm','5 mm','6 mm'],'img'=>'images/opt/hook-md.jpg'],
    ['id'=>'p5','name'=>'Yarn Tools Set','brand'=>'KIFRAN Studio','material'=>'Mango Hardwood','cat'=>'Yarn Tools','price'=>1850,'mrp'=>2300,'stock'=>15,'badge'=>'Bestseller','rating'=>4.8,'reviews'=>176,'colors'=>['Natural'],'sizes'=>[],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p6','name'=>'Carved Photo Frame','brand'=>'KIFRAN Atelier','material'=>'Teak Wood','cat'=>'Home Décor','price'=>990,'mrp'=>1200,'stock'=>5,'badge'=>'','rating'=>4.6,'reviews'=>54,'colors'=>['Natural','Walnut'],'sizes'=>['5x7','8x10'],'img'=>'images/opt/stick2-md.jpg'],
    ['id'=>'p7','name'=>'Sheesham Serving Board','brand'=>'KIFRAN Everyday','material'=>'Solid Sheesham','cat'=>'Kitchen & Dining','price'=>1450,'mrp'=>1900,'stock'=>22,'badge'=>'Trending','rating'=>4.7,'reviews'=>189,'colors'=>['Natural','Honey'],'sizes'=>['M','L'],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p8','name'=>'Hand-Turned Bowl','brand'=>'KIFRAN Atelier','material'=>'Acacia','cat'=>'Kitchen & Dining','price'=>1290,'mrp'=>1650,'stock'=>18,'badge'=>'','rating'=>4.8,'reviews'=>121,'colors'=>['Natural','Chestnut'],'sizes'=>['S','M','L'],'img'=>'images/opt/cane-md.jpg'],
    ['id'=>'p9','name'=>'Twin-Tone Cane','brand'=>'KIFRAN Heritage','material'=>'Walnut Wood','cat'=>'Canes','price'=>7400,'mrp'=>9200,'stock'=>6,'badge'=>'Top Rated','rating'=>5.0,'reviews'=>88,'colors'=>['Walnut','Ebony'],'sizes'=>['36"','38"'],'img'=>'images/opt/cane-md.jpg'],
    ['id'=>'p10','name'=>'Derby Handle Cane','brand'=>'KIFRAN Heritage','material'=>'Rosewood','cat'=>'Canes','price'=>5600,'mrp'=>7000,'stock'=>9,'badge'=>'','rating'=>4.6,'reviews'=>73,'colors'=>['Natural','Walnut'],'sizes'=>['34"','36"','38"'],'img'=>'images/opt/stick1-md.jpg'],
    ['id'=>'p11','name'=>'Folding Travel Cane','brand'=>'KIFRAN Everyday','material'=>'Bamboo','cat'=>'Canes','price'=>3200,'mrp'=>4100,'stock'=>0,'badge'=>'Hot Deal','rating'=>4.5,'reviews'=>142,'colors'=>['Natural'],'sizes'=>['36"'],'img'=>'images/opt/stick2-md.jpg'],
    ['id'=>'p12','name'=>'Ergo Crochet Set of 6','brand'=>'KIFRAN Studio','material'=>'Rosewood','cat'=>'Yarn Tools','price'=>2450,'mrp'=>3200,'stock'=>25,'badge'=>'Bestseller','rating'=>4.9,'reviews'=>333,'colors'=>['Natural','Honey'],'sizes'=>[],'img'=>'images/opt/hook-md.jpg'],
    ['id'=>'p13','name'=>'Knitting Needle Pair','brand'=>'KIFRAN Studio','material'=>'Mango Hardwood','cat'=>'Yarn Tools','price'=>520,'mrp'=>680,'stock'=>40,'badge'=>'','rating'=>4.7,'reviews'=>201,'colors'=>['Natural'],'sizes'=>['4 mm','5 mm','6 mm'],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p14','name'=>'Yarn Bowl Carved','brand'=>'KIFRAN Atelier','material'=>'Acacia','cat'=>'Yarn Tools','price'=>1680,'mrp'=>2100,'stock'=>11,'badge'=>'New','rating'=>4.8,'reviews'=>67,'colors'=>['Natural','Chestnut'],'sizes'=>[],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p15','name'=>'Meditation Mala Stand','brand'=>'KIFRAN Atelier','material'=>'Walnut Wood','cat'=>'Wellbeing','price'=>2200,'mrp'=>2800,'stock'=>7,'badge'=>'Trending','rating'=>4.9,'reviews'=>58,'colors'=>['Walnut'],'sizes'=>[],'img'=>'images/opt/stick2-md.jpg'],
    ['id'=>'p16','name'=>'Acupressure Roller','brand'=>'KIFRAN Everyday','material'=>'Teak Wood','cat'=>'Wellbeing','price'=>780,'mrp'=>990,'stock'=>33,'badge'=>'','rating'=>4.5,'reviews'=>112,'colors'=>['Natural','Honey'],'sizes'=>[],'img'=>'images/opt/hook-md.jpg'],
    ['id'=>'p17','name'=>'Posture Support Cane','brand'=>'KIFRAN Heritage','material'=>'Solid Sheesham','cat'=>'Wellbeing','price'=>6100,'mrp'=>7600,'stock'=>5,'badge'=>'Top Rated','rating'=>4.9,'reviews'=>91,'colors'=>['Natural','Walnut','Ebony'],'sizes'=>['34"','36"','38"'],'img'=>'images/opt/cane-md.jpg'],
    ['id'=>'p18','name'=>'Tea Light Trio','brand'=>'KIFRAN Atelier','material'=>'Mango Hardwood','cat'=>'Home Décor','price'=>880,'mrp'=>1100,'stock'=>28,'badge'=>'','rating'=>4.6,'reviews'=>84,'colors'=>['Natural','Chestnut'],'sizes'=>[],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p19','name'=>'Wall Shelf Bracket','brand'=>'KIFRAN Everyday','material'=>'Acacia','cat'=>'Home Décor','price'=>1340,'mrp'=>1700,'stock'=>14,'badge'=>'','rating'=>4.4,'reviews'=>46,'colors'=>['Natural','Walnut'],'sizes'=>['S','M'],'img'=>'images/opt/stick1-md.jpg'],
    ['id'=>'p20','name'=>'Carved Wall Panel','brand'=>'KIFRAN Atelier','material'=>'Rosewood','cat'=>'Home Décor','price'=>4900,'mrp'=>6400,'stock'=>3,'badge'=>'Limited','rating'=>5.0,'reviews'=>39,'colors'=>['Walnut','Ebony'],'sizes'=>['M','L'],'img'=>'images/opt/stick2-md.jpg'],
    ['id'=>'p21','name'=>'Spice Box Set','brand'=>'KIFRAN Everyday','material'=>'Sheesham','cat'=>'Kitchen & Dining','price'=>1980,'mrp'=>2500,'stock'=>16,'badge'=>'Trending','rating'=>4.7,'reviews'=>128,'colors'=>['Natural'],'sizes'=>[],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p22','name'=>'Coaster Set of 4','brand'=>'KIFRAN Studio','material'=>'Teak Wood','cat'=>'Kitchen & Dining','price'=>640,'mrp'=>850,'stock'=>50,'badge'=>'Hot Deal','rating'=>4.6,'reviews'=>233,'colors'=>['Natural','Honey'],'sizes'=>[],'img'=>'images/opt/hook-md.jpg'],
    ['id'=>'p23','name'=>'Rolling Pin Classic','brand'=>'KIFRAN Everyday','material'=>'Mango Hardwood','cat'=>'Kitchen & Dining','price'=>560,'mrp'=>0,'stock'=>35,'badge'=>'','rating'=>4.8,'reviews'=>177,'colors'=>['Natural'],'sizes'=>[],'img'=>'images/opt/stick1-md.jpg'],
    ['id'=>'p24','name'=>'Keepsake Gift Box','brand'=>'KIFRAN Atelier','material'=>'Walnut Wood','cat'=>'Gifts','price'=>1550,'mrp'=>2000,'stock'=>20,'badge'=>'New','rating'=>4.9,'reviews'=>64,'colors'=>['Walnut','Natural'],'sizes'=>['S','M'],'img'=>'images/opt/cane-md.jpg'],
    ['id'=>'p25','name'=>'Engraved Pen Stand','brand'=>'KIFRAN Studio','material'=>'Rosewood','cat'=>'Gifts','price'=>720,'mrp'=>950,'stock'=>26,'badge'=>'','rating'=>4.5,'reviews'=>71,'colors'=>['Natural','Walnut'],'sizes'=>[],'img'=>'images/opt/hook-md.jpg'],
    ['id'=>'p26','name'=>'Anniversary Cane Gift','brand'=>'KIFRAN Heritage','material'=>'Solid Sheesham','cat'=>'Gifts','price'=>8900,'mrp'=>12000,'stock'=>4,'badge'=>'Top Rated','rating'=>5.0,'reviews'=>52,'colors'=>['Natural','Walnut','Ebony'],'sizes'=>['36"','38"'],'img'=>'images/opt/cane-md.jpg'],
    ['id'=>'p27','name'=>'Desk Organiser','brand'=>'KIFRAN Everyday','material'=>'Acacia','cat'=>'Home Décor','price'=>1190,'mrp'=>1500,'stock'=>19,'badge'=>'','rating'=>4.6,'reviews'=>95,'colors'=>['Natural','Chestnut'],'sizes'=>[],'img'=>'images/opt/yarn-md.jpg'],
    ['id'=>'p28','name'=>'Heirloom Walking Cane','brand'=>'KIFRAN Heritage','material'=>'Walnut Wood','cat'=>'Canes','price'=>9600,'mrp'=>13500,'stock'=>2,'badge'=>'Limited','rating'=>5.0,'reviews'=>41,'colors'=>['Walnut','Ebony'],'sizes'=>['36"','38"'],'img'=>'images/opt/stick2-md.jpg'],
];

$inserted = 0;
$updated = 0;

foreach ($seed as $p) {
    $images = json_encode([$p['img']]);
    $gallery = json_encode([$p['img']]);
    $colors = json_encode($p['colors'] ?? ['Natural']);
    $sizes = json_encode($p['sizes'] ?? []);
    
    $stmt = $pdo->prepare("INSERT INTO products 
        (id, name, brand, material, cat, price, mrp, stock, badge, rating, reviews, 
         images, gallery, img, colors, sizes, features, specs, description,
         showDiscount, showFreeDelivery, showDelivery, showRating, showStock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name=VALUES(name), brand=VALUES(brand), material=VALUES(material), 
        cat=VALUES(cat), price=VALUES(price), mrp=VALUES(mrp), stock=VALUES(stock),
        badge=VALUES(badge), rating=VALUES(rating), reviews=VALUES(reviews),
        images=VALUES(images), gallery=VALUES(gallery), img=VALUES(img),
        colors=VALUES(colors), sizes=VALUES(sizes), updated_at=NOW()");
    
    $stmt->execute([
        $p['id'], $p['name'], $p['brand'], $p['material'], $p['cat'], 
        $p['price'], $p['mrp'], $p['stock'], $p['badge'], $p['rating'], $p['reviews'],
        $images, $gallery, $p['img'], $colors, $sizes,
        json_encode([]), json_encode([]), null,
        0, 0, 0, 1, 1
    ]);
    
    if ($stmt->rowCount() > 0) $inserted++;
    else $updated++;
}

echo json_encode([
    'success' => true,
    'inserted' => $inserted,
    'updated' => $updated,
    'total' => count($seed)
]);
?>
