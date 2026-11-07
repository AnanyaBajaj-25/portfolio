import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js?v=9';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');
const count = projects?.length ?? 0;
projectsTitle.textContent = `${count} ${count === 1 ? 'Project' : 'Projects'}`;

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let query = '';
let selectedYear = null;

function matchesQuery(project) {
  let values = Object.values(project).join('\n').toLowerCase();
  return values.includes(query.toLowerCase());
}

function selectYear(year) {
  selectedYear = selectedYear === year ? null : year;
  render();
}

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  let newSVG = d3.select('#projects-pie-plot');
  newSVG.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  newArcs.forEach((arc, idx) => {
    let year = newData[idx].label;
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(year))
      .attr('class', year === selectedYear ? 'selected' : null)
      .on('click', () => selectYear(year));
  });

  newData.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectYear(d.label));
  });
}

function render() {
  let searchedProjects = projects.filter(matchesQuery);

  if (!searchedProjects.some((project) => project.year === selectedYear)) {
    selectedYear = null;
  }

  let visibleProjects = selectedYear === null
    ? searchedProjects
    : searchedProjects.filter((project) => project.year === selectedYear);

  renderProjects(visibleProjects, projectsContainer, 'h2');
  renderPieChart(searchedProjects);
}

render();

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  render();
});
