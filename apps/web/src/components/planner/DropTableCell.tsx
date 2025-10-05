import { FC, useEffect, useRef, useState } from "react";
import { TableCell } from "../ui/table";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { cn } from "@/lib/utils";

interface DropTableCellProps
  extends React.HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  employeeId: string;
  columnIndex: number;
}

const DropTableCell: FC<DropTableCellProps> = ({
  children,
  employeeId: resourceId,
  columnIndex,
  ...props
}) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const element = ref.current!;

    return dropTargetForElements({
      element,
      getData: () => {
        return { resourceId: resourceId, columnIndex: columnIndex };
      },
      onDragEnter: () => setIsOver(true),
      onDragLeave: () => setIsOver(false),
      onDrop: () => {
        setIsOver(false);
      },
    });
  }, [resourceId, columnIndex]);

  return (
    <TableCell
      className={cn(
        "border bg-background min-w-[150px] p-2",
        isOver ? "bg-primary-foreground" : "bg-background"
      )}
      ref={ref}
      {...props}
    >
      <div className="overflow-hidden">{children}</div>{" "}
    </TableCell>
  );
};

export default DropTableCell;
