import { gray300 } from "@atrilabs/design-system";
import {
  CallbackHandler,
  NavigationCallbackHandler,
} from "@atrilabs/react-component-manifest-schema/lib/types";
import { useCallback, useMemo } from "react";
import { ReactComponent as AddIcon } from "./assets/add.svg";
import { useFileUploadAliases } from "./hooks/useFileUploadAliases";
import { usePageRoutes } from "./hooks/usePageRoutes";
import { ReactComponent as MinusIcon } from "./assets/minus.svg";
export type TabBodyProps = {
  patchCb: (slice: any) => void;
  compId: string;
  // comes from component tree
  callbacks: { [callbackName: string]: CallbackHandler };
  // comes from component manifest
  callbackNames: string[];
  getAlias: (id: string) => string | undefined;
};

function callbackHandlerToText(handler: CallbackHandler["0"]) {
  if ("sendFile" in handler && "self" in handler["sendFile"]) {
    return `Send own file`;
  }
  if ("sendFile" in handler && "alias" in handler["sendFile"]) {
    return `Send file from ${handler["sendFile"]["alias"]}`;
  }
  if ("navigate" in handler && handler["navigate"].type === "internal") {
    return `Navigate to ${handler.navigate.url}`;
  }
  if ("navigate" in handler && handler["navigate"].type === "external") {
    return `Navigate to external url`;
  }
  if ("sendEventData" in handler) {
    return "Send event data";
  }
  return "Unknown action";
}

function surelyReutrnArray(arr: any[]) {
  return arr || [];
}

export const TabBody: React.FC<TabBodyProps> = (props) => {
  const { fileUploadActions } = useFileUploadAliases();
  const { routes } = usePageRoutes();

  const options = useMemo(() => {
    const options: { action: CallbackHandler["0"]; value: number }[] = [];
    // file uploads
    fileUploadActions.forEach((fileUploadActions) => {
      if (fileUploadActions.alias === props.getAlias(props.compId)) {
        const action: CallbackHandler["0"] = {
          sendFile: { self: true, props: fileUploadActions.props },
        };
        options.push({ action, value: options.length + 1 });
      } else {
        const action: CallbackHandler["0"] = {
          sendFile: {
            alias: fileUploadActions.alias,
            props: fileUploadActions.props,
          },
        };
        options.push({ action, value: options.length + 1 });
      }
    });
    // internal navigation
    routes.forEach((route) => {
      const action: CallbackHandler["0"] = {
        navigate: { type: "internal", url: route },
      };
      options.push({ action, value: options.length + 1 });
    });
    // external navigation
    options.push({
      action: { navigate: { type: "external", url: "" } },
      value: options.length + 1,
    });
    // send event data
    options.push({
      action: { sendEventData: true },
      value: options.length + 1,
    });
    return options;
  }, [fileUploadActions, props, routes]);

  const onChangeAction = useCallback(
    (callbackName: string, index: number, value: number) => {
      // value === 0 implies that user selected the already selected option
      if (value === 0) return;
      const previousActions = [
        ...surelyReutrnArray(props.callbacks[callbackName]),
      ];
      const action = options[value - 1].action;
      previousActions.splice(index, 1, action);
      props.patchCb({
        property: {
          callbacks: {
            [callbackName]: previousActions,
          },
        },
      });
    },
    [options, props]
  );

  const onExternalNavigationChange = useCallback(
    (
      callbackName: string,
      index: number,
      action: { navigate: NavigationCallbackHandler }
    ) => {
      const previousActions = [
        ...surelyReutrnArray(props.callbacks[callbackName]),
      ];
      previousActions.splice(index, 1, action);
      props.patchCb({
        property: {
          callbacks: {
            [callbackName]: previousActions,
          },
        },
      });
    },
    [props]
  );

  const onInsertAction = useCallback(
    (callbackName: string) => {
      const previousActions = [
        ...surelyReutrnArray(props.callbacks[callbackName]),
      ];
      const defaultAction: CallbackHandler["0"] = { sendEventData: true };
      previousActions.push(defaultAction);
      props.patchCb({
        property: {
          callbacks: {
            [callbackName]: previousActions,
          },
        },
      });
    },
    [props]
  );

  const onRemoveAction = useCallback(
    (callbackName: string, index: number) => {
      const previousActions = [
        ...surelyReutrnArray(props.callbacks[callbackName]),
      ];
      previousActions.splice(index, 1);
      props.patchCb({
        property: {
          callbacks: {
            [callbackName]: previousActions,
          },
        },
      });
    },
    [props]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {props.callbackNames.map((callbackName) => {
        return (
          <div
            key={callbackName}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: gray300,
              }}
            >
              <div>{callbackName}</div>
              <div
                onClick={() => {
                  onInsertAction(callbackName);
                }}
              >
                <AddIcon />
              </div>
            </div>

            {surelyReutrnArray(props.callbacks[callbackName]).map(
              (handler, index) => {
                const selectedActionText = callbackHandlerToText(handler);
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      flexDirection: "column",
                    }}
                  >
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <select
                        onChange={(e) => {
                          onChangeAction(
                            callbackName,
                            index,
                            parseInt(e.target.value)
                          );
                        }}
                      >
                        <option value={0}>{selectedActionText}</option>
                        {options
                          .filter(
                            (option) =>
                              callbackHandlerToText(option.action) !==
                              selectedActionText
                          )
                          .map((option) => {
                            return (
                              <option key={option.value} value={option.value}>
                                {callbackHandlerToText(option.action)}
                              </option>
                            );
                          })}
                      </select>
                      <div
                        style={{ display: "flex", alignItems: "center" }}
                        onClick={() => {
                          onRemoveAction(callbackName, index);
                        }}
                      >
                        <MinusIcon />
                      </div>
                    </div>
                    {handler["navigate"]?.type === "external" ? (
                      <div>
                        <input
                          value={handler.navigate["url"] || ""}
                          onChange={(e) => {
                            onExternalNavigationChange(callbackName, index, {
                              navigate: {
                                type: "external",
                                url: e.target.value,
                              },
                            });
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              }
            )}
          </div>
        );
      })}
    </div>
  );
};
