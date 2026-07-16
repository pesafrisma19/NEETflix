import urllib.request, re
html = urllib.request.urlopen('https://tenor.com/view/like-gif-15647806772764238870').read().decode('utf-8')
match = re.search(r'https://media1\.tenor\.com/[a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+\.gif', html)
if match:
    print(match.group(0))
else:
    match2 = re.search(r'https://media\.tenor\.com/[^\"\' \?]+', html)
    if match2:
        print(match2.group(0))
    else:
        print("Not found")
