import * as semver from 'semver';
import { Logger, HttpError, BaseRequest, BaseResponse, HttpCode } from "ts-framework";

export interface VersioningOptions {
  verbose?: boolean;
  current: string;
  minimum?: string;
  recommended?: string;
  header?: string;
  requestedHeader?: string;
  recommendedHeader?: string;
}

export default class Versioning {
  /**
   * The express middleware for handling Versioning using headers.
   * 
   * @param req The request instance
   * @param res The response instance
   * @param next The reference to the middleware chain
   */
  public static middleware(options: VersioningOptions) {
    if (options.verbose) {
      Logger.info(`Initializing server middleware: Versioning`);
    }

    return (req: BaseRequest, res: BaseResponse, next: Function) => {
      // Add the current server version to the response
      res.set(options.header || 'X-API-Version', options.current);

      // Get requested version from header
      const requestedVersion = req.header(options.requestedHeader || 'X-API-Requested-Version');

      if (requestedVersion && !semver.valid(requestedVersion)) {
        // Could not recognize the semver requested version
        throw new HttpError(`Invalid requested version: ${requestedVersion}`, HttpCode.Client.BAD_REQUEST, { current: options.current });
      } else if (requestedVersion && semver.lt(options.current, requestedVersion)) {
        throw new HttpError(`Unsupported version: ${requestedVersion}`, HttpCode.Client.BAD_REQUEST, { current: options.current });
      } else if (requestedVersion && !semver.satisfies(requestedVersion, options.current)) {
        // Check if the version satisfies the current one
        if (options.minimum && !semver.gte(requestedVersion, options.minimum)) {
          res.set(options.recommendedHeader || 'X-API-Recommended-Version', options.recommended);
          throw new HttpError(`Unsupported version: ${requestedVersion}`, HttpCode.Client.BAD_REQUEST, { current: options.current });
        } else if (options.recommended && !semver.gte(requestedVersion, options.recommended)) {
          res.set(options.recommendedHeader || 'X-API-Recommended-Version', options.recommended);
        }
      }

      // Continue the request
      next();
    }
  }
}