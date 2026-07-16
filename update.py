import os
import re

files = [
  'src/components/cart/Cart.jsx',
  'src/components/categorycard/CategoryCard.jsx',
  'src/components/sidecard/Sidecard.jsx',
  'src/components/topten/Topten.jsx',
  'src/components/trending/Trending.jsx',
  'src/components/banner/Banner.jsx',
  'src/components/episodelist/EpisodeList.jsx',
  'src/components/suggestion/Suggestion.jsx',
  'src/components/schedule/Schedule.jsx'
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        if 'import formatSlug' not in content:
            content = 'import formatSlug from "@/src/utils/formatSlug";\n' + content
            
        content = re.sub(r'`/\$\{item\.id\}`', r'`/${formatSlug(item.title, item.id)}`', content)
        content = re.sub(r'`/watch/\$\{item\.id\}`', r'`/watch/${formatSlug(item.title, item.id)}`', content)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Updated', f)
