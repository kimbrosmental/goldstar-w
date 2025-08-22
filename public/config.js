// Simple pass-through "encryption" so admin UI works end-to-end.
// In production, replace with real crypto.
window.encrypt = async function(data){
  try {
    return JSON.stringify(data);
  } catch(e){
    return String(data);
  }
};
window.decrypt = function(str){
  try {
    if (typeof str === 'string') return JSON.parse(str);
    return str;
  } catch(e){
    return null;
  }
};