#!/usr/bin/env python3
"""Apply the reviewed home direction to a fresh current homepage.

Preserves each current portfolio card byte-for-byte, including concurrent media.
Use only in an isolated checkout after fetching current main. Never deploys.
"""
import argparse,re
from pathlib import Path

def apply(source):
    cards=re.findall(r'<article class="work-card[^>]*>[\s\S]*?</article>',source)
    if len(cards)!=12:raise ValueError('Catalog changed; inspect before applying')
    if 'class="home-page glass-redesign"' in source:return source
    brand=re.search(r'<a class="topaz-brand"[\s\S]*?</a>',source).group()
    links='<a href="#work">Websites</a><a href="https://topazcandy.com/contact/?service=website#contact-form" data-topaz-inquiry target="_self">Custom work</a><a href="/services/">Everything we do</a>'
    header='<header class="site-header wrap">'+brand+'<nav class="nav" aria-label="Main navigation">'+links+'<a class="nav-contact" href="https://topazcandy.com/contact/?service=web-presence#contact-form" data-topaz-inquiry target="_self">Let’s talk ↗</a></nav><details class="glass-mobile-nav"><summary aria-label="Open navigation">Menu</summary><nav aria-label="Mobile navigation">'+links+'<a href="https://topazcandy.com/contact/?service=web-presence#contact-form" data-topaz-inquiry target="_self">Let’s talk ↗</a><a href="/30-day-ai/">30-day AI</a></nav></details></header>'
    hero='''<section class="hero glass-hero wrap" aria-labelledby="glass-title"><div class="glass-copy"><p class="eyebrow">Websites with character</p><h1 id="glass-title">Your business isn’t generic.<span>Your website shouldn’t be either.</span></h1><p class="lede">Distinctive websites. Clear paths to your next customer.</p><div class="actions"><a class="button" href="#work">Browse websites <span class="arrow" aria-hidden="true">↗</span></a><a class="button light" href="https://topazcandy.com/contact/?service=website#contact-form" data-topaz-inquiry target="_self">Build something custom</a></div><p class="micro">Website packages $450 USD · Three months of website care.<br><a href="https://topazcandy.com/contact/?service=web-presence&amp;intent=show-site#contact-form" data-topaz-inquiry target="_self">Already have a website? Let’s look at it ↗</a></p></div><figure class="living-glass" data-living-glass data-glass-state="poster" aria-label="A continuous amber-glass ribbon flowing, turning and gathering itself"><img class="glass-poster" src="/assets/topaz/glass/amber-ribbon-poster.webp" alt="A sculptural amber-glass ribbon with warm reflections" width="960" height="720" fetchpriority="high" decoding="async"><canvas aria-hidden="true" width="960" height="720"></canvas><button type="button" class="glass-toggle" data-glass-toggle aria-pressed="false" aria-label="Play living glass" hidden>Play motion</button></figure></section>'''
    result=re.sub(r'<header class="site-header wrap">[\s\S]*?</header>',lambda _:header,source,count=1)
    result=result.replace('<body class="home-page">','<body class="home-page glass-redesign">',1)
    result,count=re.subn(r'<section class="hero wrap">[\s\S]*?</section>',lambda _:hero,result,count=1)
    if count!=1:raise ValueError('Hero changed; inspect before applying')
    work=re.search(r'<section class="work-section" id="work">[\s\S]*?</section>',result).group()
    purchase=re.search(r'<section class="topaz-purchase"[\s\S]*?</section>',result).group()
    result=result.replace(work,'',1).replace(purchase,'',1)
    work=work.replace('<p class="eyebrow">The design side of the work</p><h2>Different businesses.<br>Different personalities.</h2>','<p class="eyebrow">Ready-made + custom websites</p><h2>Find your starting point.</h2>')
    result=result.replace(hero,hero+'\n'+work+'\n'+purchase,1)
    result=result.replace('<section class="section wrap"><div class="about-layout">','<section class="section wrap glass-support" id="about"><div class="about-layout">',1)
    result=result.replace('<section class="section wrap" id="repair">','<section class="section wrap glass-support" id="repair">',1)
    result=result.replace('</head>','<link rel="stylesheet" href="/assets/topaz/living-glass.css?v=1"></head>',1)
    result=result.replace('</body>','<script type="module" src="/assets/topaz/glass/living-glass.mjs?v=1"></script></body>',1)
    assert re.findall(r'<article class="work-card[^>]*>[\s\S]*?</article>',result)==cards
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('file',type=Path,nargs='?',default=Path('index.html'));args=parser.parse_args()
    args.file.write_text(apply(args.file.read_text()))
