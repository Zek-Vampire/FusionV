package com.fusionv.dto;

import org.springframework.core.io.Resource;

/** A file ready to be streamed to the browser. */
public record FileDownload(Resource resource, String fileName, String contentType) {
}
