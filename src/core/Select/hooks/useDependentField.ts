import React, { useSyncExternalStore } from "react";
import { useSelectStore } from "../context"

export const useDependentField = ({ fieldName, dependsOn, onDependencyChange }) => {
    const store = useSelectStore();

    const subscribe = React.useCallback((onStoreChange: () => void): (() => void) => {

    }, []);

    const getSnapshot = React.useCallback(() => {

    }, []);

    const value = useSyncExternalStore(subscribe, getSnapshot);

    return value;
}