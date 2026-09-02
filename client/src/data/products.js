const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=86`;

const womenPool = [
  U('photo-1591047139829-d91aecb6caea'),
  U('photo-1566174053879-31528523f8ae'),
  U('photo-1576566588028-4147f3842f27'),
  U('photo-1594633312681-425c7b97ccd1'),
  U('photo-1543163521-1bf539c55dd2'),
  U('photo-1595777457583-95e059d581b8'),
  U('photo-1583496661160-fb5886a13d77'),
  U('photo-1529139574466-a303027c1d8b'),
  U('photo-1515886657613-9f3515b0c78f'),
  U('photo-1490481651871-ab68de25d43d'),
];
const menPool = [
  U('photo-1603252109303-2751441dd157'),
  U('photo-1544022613-e87ca75a784a'),
  U('photo-1521572163474-6864f9cf17ab'),
  U('photo-1473966968600-fa801b869a1a'),
  U('photo-1542291026-7eec264c27ff'),
  U('photo-1523205771623-e0faa4d2813d'),
  U('photo-1617137968427-85924c800a22'),
  U('photo-1506629082955-511b1aa562c8'),
  U('photo-1516257984-b1b4d707412e'),
];
const accessoriesPool = [
  U('photo-1584917865442-de89df76afd3'),
  U('photo-1524592094714-0f0654e20314'),
  U('photo-1601924994987-69e26d50dc26'),
  U('photo-1594223274512-ad4803739b7c'),
  U('photo-1535632066927-ab7c9ab60908'),
  U('photo-1523779917675-b6ed3a42a561'),
  U('photo-1566150905458-1bf1fc113f0d'),
  U('photo-1611652022419-a9419f74343d'),
];

const reviewSet = [
  { name: 'Maya R.', rating: 5, date: '18 Aug 2026', text: 'Beautiful finish and the fit feels considered. It looks even better in person.' },
  { name: 'Amelia K.', rating: 5, date: '02 Aug 2026', text: 'The quality is excellent and delivery was quick. A piece I will wear for years.' },
  { name: 'Sofia N.', rating: 4, date: '21 Jul 2026', text: 'Minimal, elegant and easy to style. The sizing guide was accurate for me.' },
];

function gallery(main, pool, offset) {
  const secondary = pool.filter((img) => img !== main);
  return [main, secondary[offset % secondary.length], secondary[(offset + 2) % secondary.length], secondary[(offset + 4) % secondary.length]];
}

function item(data, pool, offset = 0) {
  return {
    description: 'A refined VELORA essential crafted for everyday versatility, with clean lines, elevated materials and a considered modern fit.',
    material: 'Premium responsibly sourced blend with tonal finishing.',
    care: 'Follow the garment care label. Store away from direct sunlight and excessive moisture.',
    sizes: data.category === 'Accessories' ? ['One Size'] : data.type === 'Footwear' ? ['36', '37', '38', '39', '40', '41', '42'] : ['XS', 'S', 'M', 'L', 'XL'],
    colors: [{ name: data.color, hex: data.hex || '#343330' }, ...(data.altColors || [])],
    reviews: reviewSet,
    featured: false,
    ...data,
    gallery: gallery(data.image, pool, offset),
  };
}

export const products = [
  item({id:'noir-tailored-blazer',name:'Noir Tailored Blazer',category:'Women',type:'Outerwear',price:189,oldPrice:229,badge:'Bestseller',color:'Onyx',hex:'#171717',rating:4.9,stock:18,featured:true,image:womenPool[0],altColors:[{name:'Ivory',hex:'#e8e2d8'},{name:'Stone',hex:'#8f877b'}]}, womenPool, 1),
  item({id:'silk-column-dress',name:'Silk Column Dress',category:'Women',type:'Dresses',price:215,badge:'New',color:'Champagne',hex:'#d8c5a6',rating:4.8,stock:12,featured:true,image:womenPool[1],altColors:[{name:'Black',hex:'#181818'},{name:'Merlot',hex:'#6d2632'}]}, womenPool, 2),
  item({id:'atelier-leather-bag',name:'Atelier Leather Bag',category:'Accessories',type:'Bags',price:168,color:'Espresso',hex:'#4b2f25',rating:4.7,stock:20,featured:true,image:accessoriesPool[0],altColors:[{name:'Tan',hex:'#b78354'},{name:'Black',hex:'#171717'}]}, accessoriesPool, 1),
  item({id:'cashmere-knit',name:'Sculpted Cashmere Knit',category:'Women',type:'Knitwear',price:142,color:'Oat',hex:'#c6b9a2',rating:4.6,stock:15,image:womenPool[2],altColors:[{name:'Graphite',hex:'#55524f'},{name:'Cream',hex:'#eee9df'}]}, womenPool, 3),
  item({id:'wide-leg-trouser',name:'Architect Wide-Leg Trouser',category:'Women',type:'Tailoring',price:128,color:'Graphite',hex:'#565552',rating:4.8,stock:25,image:womenPool[3],altColors:[{name:'Sand',hex:'#bd9e83'},{name:'Onyx',hex:'#171717'}]}, womenPool, 4),
  item({id:'minimal-heel',name:'Minimal Sculpted Heel',category:'Women',type:'Footwear',price:176,color:'Black',hex:'#171717',rating:4.7,stock:10,image:womenPool[4],altColors:[{name:'Bone',hex:'#ddd5c7'}]}, womenPool, 5),
  item({id:'linen-shirt',name:'Relaxed Linen Shirt',category:'Men',type:'Shirts',price:96,badge:'New',color:'Ivory',hex:'#e9e5dc',rating:4.7,stock:30,featured:true,image:menPool[0],altColors:[{name:'Sky',hex:'#93a6b5'},{name:'Black',hex:'#171717'}]}, menPool, 1),
  item({id:'structured-coat',name:'Structured Wool Coat',category:'Men',type:'Outerwear',price:249,color:'Camel',hex:'#a57854',rating:4.9,stock:9,featured:true,image:menPool[1],altColors:[{name:'Charcoal',hex:'#444443'}]}, menPool, 2),
  item({id:'essential-tee',name:'Heavyweight Essential Tee',category:'Men',type:'T-Shirts',price:58,color:'Black',hex:'#171717',rating:4.5,stock:40,image:menPool[2],altColors:[{name:'White',hex:'#f3f2ed'},{name:'Olive',hex:'#666750'}]}, menPool, 3),
  item({id:'pleated-pants',name:'Pleated City Trouser',category:'Men',type:'Tailoring',price:119,color:'Stone',hex:'#8a847d',rating:4.6,stock:17,image:menPool[3],altColors:[{name:'Black',hex:'#171717'},{name:'Navy',hex:'#2d3440'}]}, menPool, 4),
  item({id:'leather-sneaker',name:'Minimal Leather Sneaker',category:'Men',type:'Footwear',price:154,color:'White',hex:'#eeeeea',rating:4.8,stock:14,image:menPool[4],altColors:[{name:'Black',hex:'#171717'}]}, menPool, 5),
  item({id:'classic-watch',name:'Classic Steel Watch',category:'Accessories',type:'Watches',price:210,color:'Silver',hex:'#a7a7a5',rating:4.9,stock:7,image:accessoriesPool[1],altColors:[{name:'Gold',hex:'#ba9857'}]}, accessoriesPool, 2),
  item({id:'silk-scarf',name:'Printed Silk Scarf',category:'Accessories',type:'Scarves',price:74,color:'Burgundy',hex:'#722b35',rating:4.6,stock:22,image:accessoriesPool[2],altColors:[{name:'Midnight',hex:'#293345'}]}, accessoriesPool, 3),
  item({id:'mini-crossbody',name:'Mini Crossbody Bag',category:'Accessories',type:'Bags',price:132,color:'Tan',hex:'#b88861',rating:4.7,stock:16,image:accessoriesPool[3],altColors:[{name:'Black',hex:'#171717'},{name:'Cream',hex:'#ece6d9'}]}, accessoriesPool, 4),
  item({id:'gold-hoops',name:'Sculptural Gold Hoops',category:'Accessories',type:'Jewellery',price:86,color:'Gold',hex:'#c2a054',rating:4.8,stock:24,image:accessoriesPool[4],altColors:[{name:'Silver',hex:'#b9bbbd'}]}, accessoriesPool, 5),
  item({id:'evening-dress',name:'Velvet Evening Dress',category:'Women',type:'Dresses',price:238,color:'Merlot',hex:'#6c2531',rating:4.9,stock:8,image:womenPool[5],altColors:[{name:'Black',hex:'#171717'}]}, womenPool, 6),
  item({id:'denim-jacket',name:'Indigo Denim Jacket',category:'Men',type:'Outerwear',price:138,color:'Indigo',hex:'#3f5268',rating:4.6,stock:19,image:menPool[5],altColors:[{name:'Washed Black',hex:'#4a4a49'}]}, menPool, 6),
  item({id:'satin-skirt',name:'Bias Satin Midi Skirt',category:'Women',type:'Skirts',price:112,color:'Pearl',hex:'#e1d6c5',rating:4.7,stock:21,image:womenPool[6],altColors:[{name:'Black',hex:'#171717'},{name:'Olive',hex:'#6c7057'}]}, womenPool, 7),
];
