import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import * as d3Selection from "d3-selection";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";

// Styles
import styles from "../styles/EmployeeClusterVisualization.module.css";

export default function EmployeeClusterVisualization({
  employees,
  selectedEmployees,
  optimalCluster,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!employees.length) return;

    // Create nodes for each employee
    const nodes = employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      isSelected: selectedEmployees.some((e) => e.id === employee.id),
      isOptimal: optimalCluster.some((e) => e.id === employee.id),
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));

    // Add HQ node first to ensure it exists
    nodes.push({ id: "HQ", name: "HQ", isHQ: true, x: 0, y: 0 });

    // Create links between nodes (only after HQ node exists)
    const links = [];

    // Add links between selected employees
    selectedEmployees.forEach((employee) => {
      const sourceNode = nodes.find(n => n.id === employee.id);
      if (sourceNode) {  // Only create link if node exists
        links.push({
          source: sourceNode,  // Pass node object instead of id
          target: nodes.find(n => n.id === "HQ"),  // Pass target node object
          type: "selected",
        });
      }
    });

    // Add links between optimal cluster employees
    optimalCluster.forEach((employee) => {
      if (!selectedEmployees.some((e) => e.id === employee.id)) {
        const sourceNode = nodes.find(n => n.id === employee.id);
        if (sourceNode) {  // Only create link if node exists
          links.push({
            source: sourceNode,  // Pass node object instead of id
            target: nodes.find(n => n.id === "HQ"),  // Pass target node object
            type: "optimal",
          });
        }
      }
    });

    // Set up the SVG
    const width = 300;
    const height = 300;
    const svg = d3Selection
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Clear previous content
    svg.selectAll("*").remove();

    // Create the simulation
    const simulation = forceSimulation(nodes)
      .force(
        "link",
        forceLink(links)
          .distance(50)  // Added fixed distance
          .strength(0.5)  // Reduced strength for smoother movement
      )
      .force("charge", forceManyBody().strength(-100))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius(20))
      .force("x", forceX())
      .force("y", forceY());

    // Draw links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", (d) =>
        d.type === "selected" ? styles.selectedLink : styles.optimalLink
      );

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => (d.isHQ ? 15 : 10))
      .attr("class", (d) =>
        d.isHQ
          ? styles.hqNode
          : d.isSelected
          ? styles.selectedNode
          : d.isOptimal
          ? styles.optimalNode
          : styles.defaultNode
      );

    // Add labels
    const label = svg
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => (d.isHQ ? "HQ" : d.name))
      .attr("class", styles.nodeLabel)
      .attr("dy", (d) => (d.isHQ ? 25 : 20))
      .attr("text-anchor", "middle");

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

      label.attr("x", (d) => d.x).attr("y", (d) => d.y);
    });

    return () => {
      simulation.stop();
    };
  }, [employees, selectedEmployees, optimalCluster]);

  return <svg ref={svgRef} className={styles.visualization} />;
}

EmployeeClusterVisualization.propTypes = {
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedEmployees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  optimalCluster: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
};
