// Map operator value to name 
export const  mapOperator = (o) => {
  let op = o;
  if (o === 'INTERSECT') op = 'AND';
  else if (o === 'UNION') op = 'OR';
  else if (o === 'MINUS') op = 'SUBTRACT';
  else if (o === 'EQUALS') op = '=';
  else if (o === 'NOT') op = '!=';
  
  return op;
}