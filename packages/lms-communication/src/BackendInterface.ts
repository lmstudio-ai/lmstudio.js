/* eslint-disable @typescript-eslint/ban-types */
import { z, type ZodType } from "zod";
import type { Channel } from "./Channel";

export type RpcEndpointHandler<TContext = any, TParameter = any, TReturns = any> = (
  ctx: TContext,
  parameter: TParameter,
) => TReturns | Promise<TReturns>;

export type ChannelEndpointHandler<
  TContext = any,
  TCreationParameter = any,
  TToServerPacket = any,
  TToClientPacket = any,
> = (
  ctx: TContext,
  creationParameter: TCreationParameter,
  channel: Channel<TToServerPacket, TToClientPacket>,
) => void;

export interface RpcEndpoint {
  name: string;
  parameter: z.ZodType;
  returns: z.ZodType;
  handler: RpcEndpointHandler | null;
}

export interface ChannelEndpoint {
  name: string;
  creationParameter: z.ZodType;
  toServerPacket: z.ZodType;
  toClientPacket: z.ZodType;
  handler: ChannelEndpointHandler | null;
}

interface RpcEndpointSpecBase {
  parameter: any;
  returns: any;
}

export type RpcEndpointsSpecBase = {
  [endpointName: string]: RpcEndpointSpecBase;
};

interface ChannelEndpointSpecBase {
  creationParameter: any;
  toServerPacket: any;
  toClientPacket: any;
}

export type ChannelEndpointsSpecBase = {
  [endpointName: string]: ChannelEndpointSpecBase;
};

export class BackendInterface<
  TContext = never,
  TRpcEndpoints extends RpcEndpointsSpecBase = {},
  TChannelEndpoints extends ChannelEndpointsSpecBase = {},
> {
  private unhandledEndpoints = new Set<string>();
  private existingEndpointNames = new Set<string>();
  private rpcEndpoints = new Map<string, RpcEndpoint>();
  private channelEndpoints = new Map<string, ChannelEndpoint>();

  public constructor() {}

  public withContextType<TContextType>() {
    return this as any as BackendInterface<TContextType, TRpcEndpoints, TChannelEndpoints>;
  }

  private assertEndpointNameNotExists(endpointName: string) {
    if (this.existingEndpointNames.has(endpointName)) {
      throw new Error(`Endpoint with name ${endpointName} already exists`);
    }
  }

  /**
   * Register an Rpc endpoint.
   */
  public addRpcEndpoint<
    TEndpointName extends string,
    TParametersZod extends ZodType,
    TReturnsZod extends ZodType,
  >(
    endpointName: TEndpointName,
    {
      parameter,
      returns,
    }: {
      parameter: TParametersZod;
      returns: TReturnsZod;
    },
  ): BackendInterface<
    TContext,
    TRpcEndpoints & {
      [endpointName in TEndpointName]: {
        parameter: z.infer<TParametersZod>;
        returns: z.infer<TReturnsZod>;
      };
    },
    TChannelEndpoints
  > {
    this.assertEndpointNameNotExists(endpointName);
    this.existingEndpointNames.add(endpointName);
    this.rpcEndpoints.set(endpointName, {
      name: endpointName,
      parameter,
      returns,
      handler: null,
    });
    return this;
  }

  public addChannelEndpoint<
    TEndpointName extends string,
    TCreationParameterZod extends ZodType,
    TToServerPacketZod extends ZodType,
    TToClientPacketZod extends ZodType,
  >(
    endpointName: TEndpointName,
    {
      creationParameter,
      toServerPacket,
      toClientPacket,
    }: {
      creationParameter: TCreationParameterZod;
      toServerPacket: TToServerPacketZod;
      toClientPacket: TToClientPacketZod;
    },
  ): BackendInterface<
    TContext,
    TRpcEndpoints,
    TChannelEndpoints & {
      [endpointName in TEndpointName]: {
        creationParameter: z.infer<TCreationParameterZod>;
        toServerPacket: z.infer<TToServerPacketZod>;
        toClientPacket: z.infer<TToClientPacketZod>;
      };
    }
  > {
    this.assertEndpointNameNotExists(endpointName);
    this.existingEndpointNames.add(endpointName);
    this.channelEndpoints.set(endpointName, {
      name: endpointName,
      creationParameter,
      toServerPacket,
      toClientPacket,
      handler: null,
    });
    return this;
  }

  public addSignalEndpoint<
    TEndpointName extends string,
    TCreationParameterZod extends ZodType,
    TSignalDataZod extends ZodType,
  >(
    endpointName: TEndpointName,
    {
      creationParameter,
      signalData,
    }: {
      creationParameter: TCreationParameterZod;
      signalData: TSignalDataZod;
    },
  ): BackendInterface<
    TContext,
    TRpcEndpoints,
    TChannelEndpoints & {
      [endpointName in TEndpointName]: {
        creationParameter: z.infer<TCreationParameterZod>;
        toServerPacket: undefined;
        toClientPacket: z.infer<TSignalDataZod>;
      };
    }
  > {
    return this.addChannelEndpoint(endpointName, {
      creationParameter,
      toServerPacket: z.undefined(),
      toClientPacket: signalData,
    });
  }

  /**
   * Adds a handler for an Rpc endpoint.
   */
  public handleRpcEndpoint<TEndpointName extends string>(
    endpointName: TEndpointName,
    handler: RpcEndpointHandler<
      TContext,
      TRpcEndpoints[TEndpointName]["parameter"],
      TRpcEndpoints[TEndpointName]["returns"]
    >,
  ) {
    const endpoint = this.rpcEndpoints.get(endpointName);
    if (endpoint === undefined) {
      throw new Error(`No Rpc endpoint with name ${endpointName}`);
    }
    if (endpoint.handler !== null) {
      throw new Error(`Rpc endpoint with name ${endpointName} already has a handler`);
    }
    endpoint.handler = handler;
    this.unhandledEndpoints.delete(endpointName);
  }

  /**
   * Adds a handler for a channel endpoint.
   */
  public handleChannelEndpoint<TEndpointName extends string>(
    endpointName: TEndpointName,
    handler: ChannelEndpointHandler<
      TContext,
      TChannelEndpoints[TEndpointName]["creationParameter"],
      TChannelEndpoints[TEndpointName]["toServerPacket"],
      TChannelEndpoints[TEndpointName]["toClientPacket"]
    >,
  ) {
    const endpoint = this.channelEndpoints.get(endpointName);
    if (endpoint === undefined) {
      throw new Error(`No channel endpoint with name ${endpointName}`);
    }
    if (endpoint.handler !== null) {
      throw new Error(`Channel endpoint with name ${endpointName} already has a handler`);
    }
    endpoint.handler = handler;
    this.unhandledEndpoints.delete(endpointName);
  }

  public assertAllEndpointsHandled() {
    if (this.unhandledEndpoints.size > 0) {
      throw new Error(
        `The following endpoints were not handled: ${Array.from(this.unhandledEndpoints).join(
          ", ",
        )}`,
      );
    }
  }

  public getRpcEndpoint(endpointName: string) {
    return this.rpcEndpoints.get(endpointName);
  }

  public getChannelEndpoint(endpointName: string) {
    return this.channelEndpoints.get(endpointName);
  }
}
