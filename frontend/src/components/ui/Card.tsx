import { cn } from "@/lib/cn";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white shadow-sm",
        "dark:border-neutral-800 dark:bg-neutral-950",
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pb-2", props.className)} {...props} />;
}

export function CardTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-medium text-neutral-700 dark:text-neutral-200",
        props.className
      )}
      {...props}
    />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-2", props.className)} {...props} />;
}