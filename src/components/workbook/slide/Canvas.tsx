import { fabric } from "fabric";
import { useEffect } from "react";

/**
 * Modified the add function prototype to add
 * an id during the addition of an object
 */
fabric.Canvas.prototype.add = (function(originalFn) {
  //@ts-ignore
  return function(...args) {
    args[0].id = getUniqueId();
     //@ts-ignore
    originalFn.call(this, ...args)
     //@ts-ignore
    return this;
  };
})(fabric.Canvas.prototype.add);

// Generates unique ID
const getUniqueId = function () {
  return '_' + Math.random().toString(36).substr(2, 9);
};

const canvasConfig = {
  isDrawingMode: true,
  width: 640,
  height: 360,
  backgroundColor: "rgba(0,0,0,0)",
};

type Props = {
  onChange(fabricObjects: string | null): void;
  fabricObjects: string | null;
  pageCount: number;
  canvasOptions: any;
};

let canvas: fabric.Canvas;

const Slide = (props: Props) => {
  const { fabricObjects, onChange, pageCount, canvasOptions } = props;

  useEffect(() => {
    canvas = new fabric.Canvas("canvas", canvasConfig);
    canvas.freeDrawingBrush.color = "white";
    canvas.freeDrawingBrush.width = 2;
    registerEvents();
  }, []);

  useEffect(() => {
    canvas.freeDrawingBrush.width = canvasOptions.brushStroke / 10;
    canvas.freeDrawingBrush.color = canvasOptions.color;
  }, [canvasOptions]);

  useEffect(() => {
    resizeCanvasToFillItsContainer();
    canvas.clear();
    //@ts-ignore
    canvas.loadFromJSON(fabricObjects);
  }, [pageCount]);

  useEffect(() => {
    if (!fabricObjects) {
      canvas.clear();
    } else {
      restoreObjectsAndSelection();
    }
  }, [fabricObjects]);

  const restoreObjectsAndSelection = () => {
    const activeObjects = canvas.getActiveObjects();
    // @ts-ignore
    const selectedObjectIds = activeObjects.map(activeObject=>activeObject.id);
    // @ts-ignore
    canvas.loadFromJSON(fabricObjects,);
    const selectedObjects: fabric.Object[] = getSelectedObjects(selectedObjectIds);
    activateSelectedObjects(selectedObjects)
  }
  
  const getSelectedObjects = (ids:string[]) => {
    return canvas.getObjects().filter(object=>{
      //@ts-ignore
      return ids.includes(object.id)
    })
  }

  const activateSelectedObjects = (selectedObjects:any) => {
    if(selectedObjects.length>0) {
      var sel = new fabric.ActiveSelection(selectedObjects, {
        canvas: canvas,
      });
      canvas.setActiveObject(sel);
      canvas.requestRenderAll();
    }
  }

  useEffect(() => {
    canvas.isDrawingMode = canvasOptions.isDrawingMode;
  }, [canvasOptions.isDrawingMode]);

  useEffect(() => {
    changeColorOfSelectedItems();
  }, [canvasOptions.color]);

  const registerEvents = () => {
    canvas.on("mouse:up", setCanvasState);
    window.onkeydown = handleKeyPress;
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Delete") {
      canvas
        .getActiveObjects()
        .map((activeObject) => canvas.remove(activeObject));
      canvas.discardActiveObject();
      setCanvasState();
    }
  };

  const setCanvasState = () => {
    onChange(JSON.stringify(canvas.toJSON(["id"])));
  };

  const resizeCanvasToFillItsContainer = () => {
    const { width, height } = getDimensionsOfElement(".canvas-container");
    setPropInCanvas("width", width);
    setPropInCanvas("height", height);
  };

  const getDimensionsOfElement = (selector: string) => {
    const canvasContainerRef = document.querySelector(
      selector
    ) as HTMLDivElement;
    return {
      width: canvasContainerRef.offsetWidth,
      height: canvasContainerRef.offsetHeight,
    };
  };

  const setPropInCanvas = (prop: string, value: number) => {
    // Dimensions need to be updated in 3 places
    // Fabric canvas reference, upper canvas, lower canvas

    // @ts-ignore
    setPropInSelector(".upper-canvas", prop, value);
    setPropInSelector(".lower-canvas", prop, value);
    // @ts-ignore
    canvas.setDimensions({ [prop]: value });
  };

  const setPropInSelector = (selector: string, prop: string, value: number) => {
    const canvasRef = document.querySelector(selector) as MappingWithStringKey;
    canvasRef.style[prop] = `${value}px`;
    canvasRef[prop] = value;
  };

  // MappingWithStringKey is defined to specify index signature (prop)
  // to be of type string
  interface MappingWithStringKey {
    [key: string]: any;
  }

  const changeColorOfSelectedItems = () => {
    if (canvas.getActiveObjects().length > 0) {
      canvas.getActiveObjects().forEach((activeObject) => {
        activeObject.stroke = canvasOptions.color;
      });
      setCanvasState();
    }
  };

  return (
    <>
      <style>{getStyle({ canvasOptions })}</style>
      <canvas id="canvas"></canvas>
    </>
  );
};

// canvas-container is a class specified by fabric library
// Unless !important is provided, the styles in fabric is not overridden
const getStyle = ({ canvasOptions }: any) => `
  .canvas-container {
    width:100% !important;
    height:100% !important;
    max-width:100% !important;
    background-color:black;
  }
  canvas {
    z-index:10;
    pointer-events:${canvasOptions.interact ? "none" : "auto"};
  }
`;

export default Slide;
