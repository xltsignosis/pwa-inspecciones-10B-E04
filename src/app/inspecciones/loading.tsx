//este arhivo es para manejar loading en SSR para que el comportamients sea real u no simulado
import { LoadingState } from "@/components/loading-state";

export default function Loading() {
  return <LoadingState status="loading" />;
}