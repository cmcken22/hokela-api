const formatLocation = ({ city, province, country }) => {
  if (city.toLowerCase() === 'remote') return 'Remote';
  return `${city}, ${province}, ${country}`;
}

module.exports = formatLocation;