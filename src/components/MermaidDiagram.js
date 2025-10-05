// components/MermaidDiagram.js
import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

const MermaidDiagram = ({ chart }) => {
  const ref = useRef(null);

  //useEffect problem - this should happen at App level.
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "default",
      securityLevel: "loose",
    });
    mermaid.contentLoaded();
  }, []);

  return (
    <div className="mermaid" ref={ref}>
      {chart}
    </div>
  );
};

export default MermaidDiagram;
