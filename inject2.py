src=open('C:/Users/Admin/Desktop/MathSideDown/script.js',encoding='utf-8').read()
bank=open('C:/Users/Admin/Desktop/MathSideDown/bank_code.py',encoding='utf-8').read()
# remove trailing PYEOF if present
lines=bank.splitlines()
while lines and lines[-1].strip()=='PYEOF':
    lines.pop()
bank='\n'.join(lines)+'\n'
marker='function genQuestion(){'
assert marker in src, 'marker not found'
src=src.replace(marker, bank+'\n'+marker, 1)
old='function genQuestion(){\n  const L=level;'
new='function genQuestion(){\n  const L=level;\n  if(L===\'highschool\'||L===\'college\') return genPdfQuestion(L);'
assert old in src, 'old not found'
src=src.replace(old,new,1)
open('C:/Users/Admin/Desktop/MathSideDown/script.js','w',encoding='utf-8').write(src)
print('injected ok')
